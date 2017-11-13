from django.shortcuts import render, HttpResponse
from pymongo import MongoClient
import json
import pytz
from bson.objectid import ObjectId
from runs.models import run_comment, run_search_form, RunCommentForm
from django.contrib.auth.decorators import login_required
from django.http import HttpResponsePermanentRedirect
import datetime
from bson.json_util import dumps, loads
import simplejson
from django.conf import settings
from django.conf import settings
import logging
from django.http import StreamingHttpResponse

import copy
import matplotlib
matplotlib.use('agg')
import matplotlib as mplt
import types
from matplotlib.patches import Rectangle
from matplotlib import patches
from collections import OrderedDict
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas
from matplotlib.figure import Figure
import matplotlib.dates as mdates
import matplotlib.pyplot as plt
from matplotlib.figure import Figure
    
# Get an instance of a logger          
logger = logging.getLogger('emo')
start_science_run = 6387
last_sr1_tag = 12515
start_sr1 = 6387
start_sr0=3936
last_tagging = 13780
sr1_query = {
    # We only use TPC
    "detector": "tpc", 
    # Only runs within the current science run
    "number": {"$gt": start_science_run}, 
    # No runs tagged bad by the shifters or with other known issues
    "tags.name": {"$nin": ["bad", "messy", "test", "donotprocess", 
                           "earthquake", "nofield", "lowfield", 
                           "ramping", "source_moving", "crash", "daqcrash",
                           "triggercrash", "_pmttrip", "noanode",
                           "rn220_contamination", "comissioning"]},
    # Anything with less than 100 events (half-minute run time in background) likely failed
    "trigger.events_built": {"$gt": 100},
    # We don't need to track LED runs. That's a separate thing.
    "source.type": {"$nin": ["LED"]}
}

@login_required
def wheres_the_data(request):
    '''
    Return a report summarizing all data sites and what data is available at each.
    '''
    client = MongoClient(settings.RUNS_DB_ADDR)
    coll = client['run']['runs_new']
    queries = {
        "Science Run 0": {"detector": "tpc", "tags.name": "_sciencerun0"},
        "Science Run 1": {"$or": [{"detector": "tpc", "tags.name": "_sciencerun1"},
                                  {"number": {"$gt": last_sr1_tag}}]}
    }
    ret = {}

    # For each query we want two aggregations I guess. One is the total processed
    # data available in each pax version. The other is the total raw data at each site
    for name, query in queries.items():

        # BAM
        allruns_cursor = coll.aggregate([
            {"$match": query},
            {"$group": {"_id": {"source": "$source.type"}, 
                        "total_runs": {"$sum": 1},
                        "data": {"$push": {"data": "$data", "number": "$number"}}}},
            {"$unwind": "$data"},
            {"$unwind": "$data.data"},
            {"$group": {"_id": {"source": "$_id.source",
                                "count": "$total_runs"},
                        "data": {"$addToSet": {"host": {"$ifNull": ["$data.data.rse", "$data.data.host"]}, 
                                               "number": "$data.number",
                                              "pax_version": {"$ifNull": ["$data.data.pax_version", "raw"]},
                                              "status": "$data.data.status"}}}},
            {"$unwind": "$data"},
            {"$unwind": "$data.host"},
            {"$match": {"data.status": "transferred"}},
            {"$group": {"_id": {"source": "$_id.source",
                               "version": "$data.pax_version",
                               "host": "$data.host",
                               "count": "$_id.count"},
                       "onsite_runs": {"$sum": 1}}},
            {"$project": {"_id": "$_id", 
                         "onsite_runs": "$onsite_runs",
                         "onsite_fraction": {"$divide": ["$onsite_runs", "$_id.count"]}}},
            {"$group": {"_id": {
                                "source": "$_id.source",
                                "total_runs": "$_id.count"
                                },
                        "sites": {"$push": {"version": "$_id.version", 
                                 "host": "$_id.host",
                                 "onsite_runs": "$onsite_runs",
                                 "onsite_fraction": "$onsite_fraction"
                                 }}}}
        ])

        ret[name] = []
        for item in allruns_cursor:
            ret[name].append({"source": item["_id"]["source"],
                              "total_runs": item["_id"]["total_runs"],
                              "sites": item["sites"]})
    
    return HttpResponse(dumps(ret), content_type="application/json")

@login_required
def get_exposure_text(request):
    client = MongoClient(settings.RUNS_DB_ADDR)
    coll = client['run']['runs_new']
    # Very basic test of 'good runs' just rejects runs 
    # tagged with known 'bad' tags
    query = {"number": {"$gt": start_science_run},
             "tags.name": {"$nin": 
                           ["bad", "messy", "test", "donotprocess", 
                            "earthquake", "nofield", "lowfield", 
                            "ramping", "source_moving", "crash", "noanode",
                            "daqcrash", "triggercrash", "_pmttrip", 
                            "rn220_contamination", "comissioning"]},
             "trigger.events_built": {"$gt": 100}}
    runtime = coll.aggregate([
        {"$match": query}, 
        {"$sort": {"start": 1}},
        {"$project": {"runtime": {"$subtract": ["$end", "$start"]},
                      "source": "$source.type",
                      "events": "$trigger.events_built"}},
        {"$group": {"_id": {"source": "$source"}, 
                    "runtime": {"$sum": "$runtime"},  
                    "events": {"$sum": "$events"}}}
    ])
    total_runtime = list(runtime)

    # Total Exposure Last 7 days
    query["start"] = {"$gt": datetime.datetime.utcnow()-
                      datetime.timedelta(days=7)}
    runtime = coll.aggregate([
        {"$match": query}, 
        {"$sort": {"start": 1}},
        {"$project": {"runtime": {"$subtract": ["$end", "$start"]},
                      "source": "$source.type",
                      "events": "$trigger.events_built"}},
        {"$group": {"_id": {"source": "$source"}, 
                    "runtime": {"$sum": "$runtime"},  
                    "events": {"$sum": "$events"}}}
    ])
    weekly_runtime = list(runtime)
    
    most_recent_processed = coll.find({
        "detector": "tpc", 
        "data": {"$elemMatch": 
                 {"type": "processed",
                  "status": "transferred",
                  "host": "midway-login1"}}}).sort("number", -1)[0]
    ret = {"mrp": {"number": most_recent_processed['number'],
                   "start": most_recent_processed['start']}}
    most_recent_run = coll.find(
        {"detector": "tpc", 
         "source.type": {"$nin": ["LED"]}}).sort("number", -1)[0]
    ret['mrr'] = {"number": most_recent_run['number'],
                  "start":most_recent_run['start']}
    ret['processing_lag'] = (((most_recent_run['start']-
                              most_recent_processed['start']).total_seconds())/3600.)
    ret['total_runtime'] = total_runtime
    ret['weekly_runtime'] = weekly_runtime
    return HttpResponse(dumps(ret), content_type="application/json")

@login_required
def get_processing_progress(request):
    
    client = MongoClient(settings.RUNS_DB_ADDR)
    coll = client['run']['runs_new']
    start_science_run = 6387
    sr1_query = {
    # We only use TPC
    "detector": "tpc",
    # Only runs within the current science run
    "number": {"$gt": start_science_run},
    # No runs tagged bad by the shifters or with other known issues
    "tags.name": {"$nin": ["bad", "messy", "test", "donotprocess",
                           "earthquake", "nofield", "lowfield",
                           "ramping", "source_moving", "crash", "daqcrash",
                           "triggercrash", "_pmttrip", "noanode",
                           "rn220_contamination", "commissioning"]},
        "trigger.events_built": {"$gt": 100},
    # We don't need to track LED runs. That's a separate thing.
    "source.type": {"$nin": ["LED"]}
    }
    cursor = coll.find(sr1_query).sort("number", 1)
    date_source = {'all': [], 'processed': []}
    date_lookup = {}
    min_date = None
    max_date = None
    for doc in cursor:
        if 'end' in doc:
            if min_date == None:
                min_date = mdates.date2num(doc['start'])
            max_date = mdates.date2num(doc['start'])
            date_source['all'].append(doc['number'])
            date_lookup[doc['number']] = {
                'source': doc['source']['type'], 
                'start': doc['start'], 'end': doc['end'], 
                'number': doc['number']}
            for d in doc['data']:
                if (d['type'] != "processed" or 
                    d['status'] != "transferred" or 
                    d['host'] != "midway-login1"):
                    continue
                if 'pax_version' not in d:
                    continue
                if d['pax_version'] not in date_source.keys():
                    date_source[d['pax_version']] = []
                date_source[d['pax_version']].append({
                    'source': doc['source']['type'], 
                    'start': doc['start'], 'end': doc['end'], 
                    'number': doc['number']})
                if doc['number'] not in date_source['processed']:
                    date_source['processed'].append(doc['number'])
                    
    #Make the plot
    plt.style.use('classic')
    fig = plt.figure(figsize=(18,4), facecolor='white')

    colors={"Rn220": '#eeb868', "AmBe": '#ef767a', 
            "Kr83m": '#49dcb1', "neutron_generator": '#3A3335', 
            "none": '#5992c2', "Th228": "#99cc00", "Cs137": "#cc3399"}
    SR_COLOR = "#99d2ff"
    labels = ["Not processed"]
    ax = plt.gca()
    plt.xlim(min_date, max_date)
    date_source['not_processed'] = []
    date_source['Not processed'] = []
    logger.error("Starting source loop")
    for d in date_source['all']:
        if d not in date_source['processed']:
            date_source['Not processed'].append(date_lookup[d])
    i = 0
    keys_sorted = sorted(date_source.keys())
    for key in keys_sorted:
        value = date_source[key]
        if key == 'all' or key == 'processed' or key == 'not_processed':
            continue
        index = 0
        if key != 'Not processed':
            i+=1
            index = i
            labels.append(key)
        for d in value:
            enddate = float(mdates.date2num(d['end']))
            startdate = float(mdates.date2num(d['start']))
            width = enddate - startdate
            lab = "background"
            if d['source'] != 'none':
                lab=d['source']
            ax.add_patch(Rectangle(
                xy=(float(mdates.date2num(d['start'])), 
                    float(index)), width=width, height=1,
                color=colors[d['source']], label=lab))

    plt.yticks(range(0, 1+len(labels)), labels)
    plt.ylim(0, len(labels))
    hfmt = mdates.DateFormatter('%m/%d')
    ax.xaxis.set_major_formatter(hfmt)
    for tick in ax.yaxis.get_major_ticks():
        tick.tick1line.set_markersize(0)
        tick.tick2line.set_markersize(0)
        tick.label1.set_verticalalignment('bottom')
        tick.label1.set_size(15)
    
    handles, labels = plt.gca().get_legend_handles_labels()
    by_label = OrderedDict(zip(labels, handles))
    box = ax.get_position()
    ax.set_position([box.x0, box.y0, box.width * 0.9, box.height])
    ax.legend(by_label.values(), by_label.keys(), 
              loc="upper left", bbox_to_anchor=(1, .8))
    
    canvas=FigureCanvas(fig)
    response=HttpResponse(content_type='image/png')
    canvas.print_png(response)
    return response
    
@login_required    
def get_current_exposure(request):
    '''
    Make the fancy plot that shows the exposure of XENON1T over time
    '''
    # For each calibration source we want to find all 'periods' where this source was used
    # This is a tiny bit tricky
    sources = ["AmBe", "Kr83m", "Rn220", "LED", "neutron_generator"]
    client = MongoClient(settings.RUNS_DB_ADDR)                                                         
    coll = client['run']['runs_new'] 

    # Tried my best. Couldn't figure out an aggregation. For loop it is.
    ranges = {}
    for source in sources:
        cursor = coll.find({"source.type": source, 
                            "number": {"$gt": start_sr0},        
                        }).sort("number", 1)
        ranges[source] = []
        first = None
        last = None
        firstNum = None
        lastNum = None
        for doc in cursor:
            if first is None:
                first = doc['start']
                firstNum = doc['number']
            if last is None:
                last = doc['start']
                lastNum = doc['number']
            if abs(doc['number'] - lastNum) < 15:
                last = doc['start']
                lastNum = doc['number']
            else:
                ranges[source].append([first, last])
                first = doc['start']
                last = doc['start']
                firstNum = doc['number']
                lastNum = doc['number']
        ranges[source].append([first, last])
        
    # Make a query to find all 'good' background exposure
    #cursor = coll.find({"tags.name": {"$in": good_tags}, "reader.ini.name": "background_stable"})
    good_tags = ["_sciencerun0", "_sciencerun1"]
    cursor = coll.find(
        {"$or": [{"tags.name": {"$in": good_tags}, "reader.ini.name": "background_stable"},
                 {"number": {"$gt": last_tagging},
                  "tags.name": {"$nin": ["_sciencerun1_candidate", "_sciencerun0_candidate"]},
                  "tags.name": {"$nin": ["bad", "messy", "test", "donotprocess", "earthquake", 
                                         "nofield", "lowfield", "ramping", "source_moving", "crash", "daqcrash",
                                         "triggercrash", "_pmttrip", "rn220_contamination", "comissioning"]},
                  "reader.ini.name": "background_stable",
                  "source.type": "none",
                  "trigger.events_built": {"$gt": 100}
              }]}).sort("number", 1)    

    cdate = []
    cumulative_runtime = []
    cumu = 0.
    for doc in cursor:
        cdate.append(doc['start'])
        cumu += (doc['end']-doc['start']).total_seconds() / (60*60*24)
        cumulative_runtime.append(cumu)

    # Plot everything. Sorry messy.
    plt.style.use('classic')
    fig = plt.figure(figsize=(18,6), facecolor='white')
    plt.plot(cdate, cumulative_runtime)
    plt.xlabel("Date", fontsize=20)
    plt.ylabel("Science run time (days)", fontsize=18)

    ax = plt.gca()
    for tick in ax.xaxis.get_major_ticks():
        tick.label.set_fontsize(14) 
    for tick in ax.yaxis.get_major_ticks():
        tick.label.set_fontsize(14) 
    # Mark the Rn220 calibrations
    for rn220 in ranges['Rn220']:
        p = patches.Rectangle(
            (mdates.date2num(rn220[0]), 0), (mdates.date2num(rn220[1])-mdates.date2num(rn220[0])), 250,
            alpha=.5, color='b', label="Rn220"
        )
        ax.add_patch(p)

    # Mark the Kr83m calibrations
    for krdate in ranges['Kr83m']:
        p =  patches.Rectangle(
            (mdates.date2num(krdate[0]), 0), (mdates.date2num(krdate[1])-mdates.date2num(krdate[0])), 250,
            alpha=.5, color='r', label="Kr83m"
        )
        ax.add_patch(p)

    # Mark the LED calibration                                                                          
    for led in ranges['LED']:
        p = patches.Rectangle(
            (mdates.date2num(led[0]), 0), (mdates.date2num(led[1])-mdates.date2num(led[0])), 250,
            alpha=.7, color='#333333', label="LED", linewidth=.3
            )
        ax.add_patch(p)

    # Mark the AmBe calibration
    for ambe in ranges['AmBe']:
        p = patches.Rectangle(
            (mdates.date2num(ambe[0]), 0), (mdates.date2num(ambe[1])-mdates.date2num(ambe[0])), 250,
            alpha=.5, color='c', label="AmBe Calibration"
        )
        ax.add_patch(p)
    for ambe in ranges['neutron_generator']:
        p = patches.Rectangle(
            (mdates.date2num(ambe[0]), 0), (mdates.date2num(ambe[1])-mdates.date2num(ambe[0])), 250,
            alpha=1., color='g', label="NG Calibration"
        )
        ax.add_patch(p)

    # ADD QUAKE IN JANUARY
    d = datetime.datetime(2017, 1, 18, 12, 0)
    md = mdates.date2num(d)
    plt.plot([md,md], [0, 250], c='k', linestyle='--', linewidth=2)

    # Funny trick from StackOverflow to limit legend to one entry per string
    handles, labels = plt.gca().get_legend_handles_labels()
    by_label = OrderedDict(zip(labels, handles))
    plt.legend(by_label.values(), by_label.keys(), loc="upper left", fontsize=16)
    ymax = int(cumu)*1.05
    plt.ylim(0, ymax)
    start_time = mdates.date2num(coll.find_one({"tags.name": {"$in": good_tags}})['start'])
    end_time = mdates.date2num(datetime.datetime.now())
    plt.xlim(start_time, end_time)
    plt.tight_layout()

    canvas=FigureCanvas(fig)
    response=HttpResponse(content_type='image/png')
    canvas.print_png(response)
    return response

'''
@login_required
def get_pax_report(request):
    client = MongoClient(settings.RUNS_DB_ADDR)
    cursor = client['run']['runs_new'].find({"detector": "tpc", "tags.name": "_sciencerun0"}) 
    dat = {"total": {}}
    for doc in cursor:
        source = doc['source']['type']
        if source not in dat['total']:
            dat["total"][source] = 0
        dat["total"][source] += 1 
        
        for entry in doc["data"]:
            if ( entry['type'] != 'processed' or 
                 entry['host'] != "midway-login1" or
                 entry['status'] != 'transferred'):
                continue
            if entry['pax_version'] not in dat:
                dat[entry['pax_version']] = {}
            if source not in dat[entry['pax_version']]:
                dat[entry['pax_version']][source]= 0
            dat[entry['pax_version']][source] += 1

    return HttpResponse(dumps(dat), content_type="application/json")
'''         

@login_required
def get_run(request):
    client = MongoClient(settings.RUNS_DB_ADDR)
    if (request.method == "GET" and "detector" in request.GET and
        ("name" in request.GET or "number" in request.GET)):
        db = client[settings.RUNS_DB_NAME]
        coll = db[settings.RUNS_DB_COLLECTION]        
        search = {"detector": request.GET['detector']}
        if "name" in request.GET:
            search["name"] = request.GET['name']
        if "number" in request.GET:
            search["number"] = int(request.GET['number'])
        doc = coll.find_one(search)
                
        if doc is not None:
            docstring = dumps(doc)            
            return HttpResponse(simplejson.dumps(simplejson.loads(docstring), ignore_nan=True), content_type="application/json")
    return HttpResponse({}, content_type="application/json")
        
@login_required
def runs_started(request):
    # Connect to pymongo                                                                                               
    client = MongoClient(settings.RUNS_DB_ADDR)
    db = client[ settings.RUNS_DB_NAME ]
    coll = settings.RUNS_DB_COLLECTION
    runs_total = db[coll].find().count()
    runs_user = db[coll].find({"user": request.user.username}).count()
    return HttpResponse(dumps({"total": runs_total, "mine": runs_user}), content_type="application/json")

@login_required
def last_run_per_det(request):
    # Connect to pymongo                                                             
    client = MongoClient(settings.RUNS_DB_ADDR)
    db = client[ settings.RUNS_DB_NAME ]

    collection = db[ settings.RUNS_DB_COLLECTION ]
    last_runs_tpc = collection.find({"detector":"tpc"}).sort("start", -1).limit(1)
    last_runs_mv = collection.find({"detector":"muon_veto"}).sort("start", -1).limit(1)
    
    retdoc = {"tpc":{}, "muon_veto":{}}
    if last_runs_tpc.count()!=0:
        last_run_tpc = last_runs_tpc[0]
        retdoc["tpc"] = { "name": last_run_tpc['name'],
                          "number": last_run_tpc['number'],
                          "source": last_run_tpc['source']['type'],
                          "user": last_run_tpc['user'],
                          "date": last_run_tpc['start']
                      }
    if last_runs_mv.count()!=0:
        last_run_mv = last_runs_mv[0]
        retdoc["muon_veto"]  = { "name":last_run_mv['name'],
                                 "source":last_run_mv['source']['type'],
                                 "user": last_run_mv['user'],
                                 "date": last_run_mv['start']
                             }
    
    return HttpResponse(dumps(retdoc), content_type="application/json")

@login_required
def runs_stream(request):

    #filter_query = {"detector": "tpc"}
    filter_query = {}

    # Connect to pymongo
    client = MongoClient(settings.RUNS_DB_ADDR)
    db = client[ settings.RUNS_DB_NAME]
    collection = db[ settings.RUNS_DB_COLLECTION ]
    fieldslist = []

    limit = 0
    offset = 0
    
    #logger.error(request.GET)

    if request.method == 'GET':
        if "limit" in request.GET:
            limit = int(request.GET['limit'])
        if "offset" in request.GET:
            offset = int(request.GET['offset'])
        if "detector" in request.GET and request.GET['detector'] != 'all':
            filter_query['detector'] = request.GET['detector']
        if "startdate" in request.GET and "enddate" in request.GET:
            start = datetime.datetime.strptime(request.GET['startdate'], "%Y-%m-%d").date()
            end = datetime.datetime.strptime(request.GET['enddate'], "%Y-%m-%d").date()
            filter_query['start'] = {"$gte": datetime.datetime.combine(start, datetime.datetime.min.time()),
                                     "$lte": datetime.datetime.combine(end, datetime.datetime.max.time())}
        elif "startdate" in request.GET:
            start = datetime.datetime.strptime(request.GET['startdate'], "%Y-%m-%d").date()
            filter_query['start'] = {"$gte": datetime.datetime.combine(start, datetime.datetime.min.time())}
        elif "enddate" in request.GET:
            end = datetime.datetime.strptime(request.GET['enddate'], "%Y-%m-%d").date()
            filter_query['start'] = {"$lte": datetime.datetime.combine(end, datetime.datetime.max.time())}

        # mongo_query supercedes everything and makes all other boxes invalid
        if "mongo_query" in request.GET:
            filter_query = loads(request.GET['mongo_query'])
            
    """
    if request.method == 'GET':
        filter_form = run_search_form( fieldslist, request.GET )
        
        if "limit" in request.GET:
            limit = int(request.GET["limit"])
        if filter_form.is_valid():
            if filter_form.cleaned_data[ 'custom' ] is not "":
                filter_query = loads( filter_form.cleaned_data['custom'] )
            if ("detector" in filter_form.cleaned_data
                and filter_form.cleaned_data['detector'] !=""):
                filter_query['detector']=filter_form.cleaned_data['detector']
            if filter_form.cleaned_data[ 'startdate' ] is not None:
                filter_query[ 'start' ]= { "$gt"
                                           : datetime.datetime.combine
                                           (filter_form.cleaned_data
                                            ['startdate'],
                                            datetime.datetime.min.time() )}
            if filter_form.cleaned_data[ 'enddate' ] is not None:
                if 'start' in filter_query.keys():
                    filter_query['starttimestamp']['$lt'] = (
                        datetime.datetime.combine(
                            filter_form.cleaned_data['enddate'],
                            datetime.datetime.max.time() )
                    )
                else:
                    filter_query[ 'start' ]= { "$lt" :
                                               datetime.datetime.combine(
                                                filter_form.cleaned_data
                                                   ['enddate'],
                                                   datetime.datetime.max.time
                                                   () )}
            if ( filter_form.cleaned_data[ 'mode' ] is not "" and
                 filter_form.cleaned_data['mode'] != 'All' ) :
                filter_query['source.type'] = filter_form.cleaned_data['mode']
    else:
        filter_form = run_search_form( fieldslist )
    """
    projection = {
        "detector": 1,
        "name": 1,
        "start": 1,
        "source": 1,
        "reader.ini.name": 1,
        "data": 1,
        "tags": 1,
        "comments": 1,
        "trigger.events_built": 1,
        "number": 1,
        "reader.self_trigger": 1
    }


    #logger.error(filter_query)
    retset = {}
    if limit!=0 and offset!=0:
        retset = collection.find( filter_query, projection ).sort( "name", -1 ).skip(offset).limit(limit)
    elif limit !=0:
        retset = collection.find( filter_query, projection ).sort( "name", -1 ).limit(limit)
    else:
        retset = collection.find( filter_query, projection ).sort( "name", -1 )

    # does this help?
    retvals = []
    for doc in retset:
        rd = {
            "detector": doc['detector'],
            "name": doc['name'],
            "start": doc['start'],
            "source": doc['source'],
            "reader": {"ini": {"name": doc['reader']['ini']['name']},
                       "self_trigger": doc['reader']['self_trigger']
                   },
            "tags": [],
            "comments": [],
            "trigger": {"events_built": 0},
            "number": None,
            "data": []
        }
        if "trigger" in doc and "events_built" in doc['trigger']:
            rd['trigger']['events_built'] = doc['trigger']['events_built']
        if "tags" in doc:
            rd['tags'] = doc['tags']
        if "comments" in doc:
            rd['comments'] = doc['comments']
        if "number" in doc:
            rd['number'] = doc['number']
        if 'data' in doc:
            for d in doc['data']:
                rd['data'].append(
                    {'host': d['host'],
                     'status': d['status'],
                     'type': d['type']
                 })
        retvals.append(rd)
                    

    return StreamingHttpResponse( dumps(retvals),
                                  #       "form" : filter_form,
                                  #      "query": filter_query}, 
                                  content_type="application/json" )

@login_required
def runs(request):
    """
    STAGED FOR REMOVAL ONCE RUNS_STREAM WORKING
    """
    filter_query = {"detector": "tpc"}

    # Connect to pymongo
    client = MongoClient(settings.RUNS_DB_ADDR)
    db = client[ settings.RUNS_DB_NAME ]

    collection = db[ settings.RUNS_DB_COLLECTION ]
    #fields = collection.distinct( "source.type" )
    #fields.insert( 0, "All" )
    #fieldslist = zip (fields, fields)
    fieldslist = []
    
    limit = 0
    if request.method == 'GET':
        filter_form = run_search_form( fieldslist, request.GET )

        # Limit
        if "limit" in request.GET:
            limit = int(request.GET["limit"])
        if filter_form.is_valid():
            #build query from form
            if filter_form.cleaned_data[ 'custom' ] is not "":
                #logger.error(filter_form.cleaned_data['custom'])
                filter_query = loads( filter_form.cleaned_data['custom'] )
            if ("detector" in filter_form.cleaned_data 
                and filter_form.cleaned_data['detector'] !=""):
                filter_query['detector']=filter_form.cleaned_data['detector']
            if filter_form.cleaned_data[ 'startdate' ] is not None:
                filter_query[ 'start' ]= { "$gt" 
                                           : datetime.datetime.combine
                                           (filter_form.cleaned_data
                                            ['startdate'],
                                            datetime.datetime.min.time() )}
            if filter_form.cleaned_data[ 'enddate' ] is not None:
                if 'start' in filter_query.keys():
                    filter_query['startdate']['$lt'] = (
                        datetime.datetime.combine(
                            filter_form.cleaned_data['enddate'],
                            datetime.datetime.max.time() )
                        )
                else:
                    filter_query[ 'start' ]= { "$lt" : 
                                               datetime.datetime.combine(
                                                   filter_form.cleaned_data
                                                   ['enddate'],
                                                   datetime.datetime.max.time
                                                   () )}
            if ( filter_form.cleaned_data[ 'mode' ] is not "" and 
                 filter_form.cleaned_data['mode'] != 'All' ) :
                filter_query['source.type'] = filter_form.cleaned_data['mode']
    else:
        filter_form = run_search_form( fieldslist )
    #logger.error(filter_query)
    
    # We only need these fields:
    projection = {
        "detector": 1,
        "name": 1,
        "start": 1,
        "source": 1,
        "data": 1,
        "tags": 1, 
        "comments": 1,
        "trigger.events_built": 1,
        "number": 1,
        "reader.self_trigger": 1
    }
    if limit!=0:
        retset = collection.find( filter_query, projection ).sort( "name", -1 ).limit(limit)
    else:
        retset = collection.find( filter_query, projection ).sort( "name", -1 )
    
    return render( request, 'runs/runs.html', {"runs_list": dumps(retset), 
                                               "form" : filter_form,
                                               "query": filter_query} )

'''
TAGS given the form:

name: string, *unique*
user: username,
date: date,

'''
@login_required
def addTag(request):

    client = MongoClient(settings.RUNS_DB_ADDR)
    if (request.method == "GET" and "tagname" in request.GET and
        "id" in request.GET and ' ' not in request.GET['tagname']):
        #logger.error(request.GET)                      
        db = client[settings.RUNS_DB_NAME]
        coll = db[settings.RUNS_DB_COLLECTION]
        search = {"_id": ObjectId(request.GET['id'])}
        doc = coll.find_one(search)

        if doc is not None and request.GET['tagname'][0]!="_":
            
            # Add tag
            update = {}
            tag = {
                "name": request.GET['tagname'],
                "user": request.user.username,
                "date": datetime.datetime.now()
            }            
            
            if "tags" not in doc and "remove" not in request.GET:
                update['$set'] = {"tags": [ tag ] }
            elif "remove" not in request.GET:
                # Check if tag exists
                for etag in doc['tags']:
                    if etag['name'] == request.GET['tagname']:
                        return HttpResponse({"success": False},
                                            content_type="application/json")

                update['$push'] = {"tags": tag}
            elif "remove" in request.GET:
                
                # Make sure the requesting user is allowed to remove the tag
                for etag in doc['tags']:
                    if (etag['name'] == request.GET['tagname'] and
                        (etag['user'] == request.user.username
                         or request.user.username == "coderre")):
                        update['$pull'] = {"tags": {"name": request.GET['tagname']}}
            
            if update!={}:
                coll.update(search, update)

            return HttpResponse(dumps({"success": True}), content_type="application/json")
    return HttpResponse({"success": False}, content_type="application/json")


"""
@login_required
def rundetail ( request ):

    # Connect to pymongo
    client = MongoClient(settings.RUNS_DB_ADDR, settings.RUNS_DB_PORT)
    db = client[ settings.RUNS_DB_NAME ]
    collection = db[ "runs" ]

    if request.method == 'POST':
        
        # A new comment on a run
        comment = run_comment( request.POST )
        run = request.GET[ 'run' ]

        # If the comment is valid update the corresponding run
        if comment.is_valid():

            insertcomment = { "text": comment.cleaned_data['text'],
                              "date": datetime.datetime.now( datetime.timezone.utc ),
                              "user": request.user.username
                            }            
            collection.update( { "name": run },
                               { "$push": { "comments": insertcomment } },
                            )
        # Go back to the runs page
        return HttpResponsePermanentRedirect( '/runs' )
    
    # This view requires a run to be requested
    if request.method != 'GET':
        print("No get request")
        return HttpResponsePermanentRedirect( '/runs' )
    
    run = request.GET['run']
    rundoc = collection.find_one( { "name": str(run) } )
    
    # Should probably replace this with some sort of error
    if rundoc is None:
        print("Not found!")
        return HttpResponsePermanentRedirect( '/' )

    return HttpResponse( dumps(rundoc), content_type = 'application/json')
"""

def download_list ( request ):
    
    ret = {}
    return HttpResponse( json.dumps( ret ), type = 'application/json' )

def get_hash_tags(comment):
    tags = []
    openTag = ""
    openT=False

    for x in comment:
        if openT:
            if x != ' ':
                openTag+=x
            else: 
                openT = False
                tags.append(openTag)
                openTag = ""
        elif x == '#':
            openT = True            
    if openT and len(openTag)>0 and not openTag.isdigit() and openTag[0]!="_":
        tags.append(openTag)
    
    return tags

@login_required
def new_comment(request):

    """                                                                         
    Add a new comment to a run entry.
    """
    c = MongoClient(settings.RUNS_DB_ADDR)
    d = c[settings.RUNS_DB_NAME]

    mongo_collection = d[settings.RUNS_DB_COLLECTION]

    if request.method == 'POST':
        #logger.error(request.POST)
        comment = RunCommentForm(request.POST)
        #logger.error(comment)
        if comment.is_valid():
            #logger.error("valid")
            # Get data                                                          
            doc_id = comment.cleaned_data['run_id']
            user = request.user.username
            date = pytz.utc.localize(datetime.datetime.now())
            
            # Now do the update to a comment if there is one                    
            if 'content' in comment.cleaned_data:
                text = comment.cleaned_data['content']
                user = request.user.username
                #logger.error(text)
                # If the entry exists append the comment to it                  
                comment_dict = {
                    "text": text,
                    "date": date,
                    "user":  user,
                    }
                
                # Scan for hash tags
                tags = get_hash_tags(text)
                if len(tags)>0:
                    for tag in tags:
                        subdoc = {
                            "name": tag,
                            "user": user,
                            "date": date
                        }
                        mongo_collection.update({"_id": ObjectId(doc_id)},
                                                {"$push": {"tags": subdoc}})
                    

                mongo_collection.update({"_id": ObjectId(doc_id)}, {"$push": 
                                                                    {"comments": 
                                                                     comment_dict}})
                return HttpResponse(dumps(comment_dict), content_type='application/json')
    return HttpResponsePermanentRedirect('/runs/')
