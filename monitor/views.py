from pymongo import MongoClient, ASCENDING, DESCENDING
from django.contrib.auth.decorators import login_required
from json import dumps, loads
from bson import json_util, objectid
from django.shortcuts import HttpResponse, HttpResponsePermanentRedirect
import pickle
#from bokeh.plotting import figure
#from bokeh.resources import CDN
#from bokeh.embed import components
#from bokeh.models import ColumnDataSource
#import mpld3
import numpy as np
#from bokeh.models import Range1d
#from bokeh.io import hplot, vplot, gridplot
#from bokeh._legacy_charts import HeatMap
import time
import datetime
from datetime import date, timedelta
from django.shortcuts import render
from django.conf import settings
from monitor.models import ScopeRequest
from pandas import DataFrame
#from bokeh.properties import value
import dateutil
import snappy
import collections
import scipy.ndimage as spi
import math
import logging
import os, sys
from pax import core
import grp
import pwd
import os

# Get an instance of a logger
#logger = logging.getLogger(__name__)
logger = logging.getLogger("emo")

# Connect to pymongo
client = MongoClient(settings.MONITOR_DB_ADDR)
db = client[settings.MONITOR_DB_NAME]
wfclient = MongoClient(settings.WAVEFORM_DB_ADDR)
wfdb = wfclient[settings.WAVEFORM_DB_NAME]
# Connect to buffer DB
bufferclient = MongoClient( settings.BUFFER_DB_ADDR)
bufferClients = ["mongodb://"+settings.BUFFER_USER+":"+settings.BUFFER_PW+
                 "@eb0:27000/admin", "mongodb://"+settings.BUFFER_USER+":"+
                 settings.BUFFER_PW+"@eb1:27000/admin", "mongodb://"+
                 settings.BUFFER_USER+":"+settings.BUFFER_PW+"@eb2:27000/admin"]
runclient = MongoClient(settings.RUNS_DB_ADDR)
runcollection = runclient[settings.RUNS_DB_NAME][settings.RUNS_DB_COLLECTION]

"""TRIGGER SECTION"""
#triggerClients = ["eb2:27001", "eb0:27017", "eb1:27017", "master:27017"]
triggerClients = ["gw:27018"]


pax_config = {
    "DEFAULT":{
        "run_number": 2000
    },
    "pax":
    {
        'output':'Dummy.DummyOutput',
        'encoder_plugin':     None,
        'pre_output': [],
        'logging_level': 'ERROR'
        #'events_to_process': []        
    },
    "MongoDB":
    {
        "user": settings.RUN_USER,
        "password": settings.RUN_PW,
        "host": "gw",
        "port": 27017,
        "database": settings.RUN_DB,
    },
}

@login_required
def get_buffer_occupancy(request):
    # Note: this crashed the DAQ when datamanager went down. So disabled.
    return HttpResponse({}, content_type="application/json")
'''
    free = 1 
    tot = 1
    try:
        free = ( os.statvfs(settings.BUFFER_PATH).f_frsize * 
                 os.statvfs(settings.BUFFER_PATH).f_bavail )
        tot = ( os.statvfs(settings.BUFFER_PATH).f_frsize *
                os.statvfs(settings.BUFFER_PATH).f_blocks ) 
    except:
        print("Can't access local buffer.")
    return HttpResponse(dumps({"free": free, "tot": tot}),
                        content_type="application/json")
'''


@login_required
def trigger_get_run_list(request):
    
    available_runs = []
    start = 0
    end = 20
    if 'start' in request.GET:
        start = request.GET['start']
    if 'end' in request.GET:
        end = request.GET['end']

    for client in triggerClients:
        
        mongoClient = MongoClient("mongodb://"+settings.GEN_USER+":"+
                                  settings.GEN_PW+"@"+client+"/"
                                  +settings.GEN_DB)        
        mongoDB = mongoClient["trigger_monitor"]
        runsClient = MongoClient(settings.RUNS_DB_ADDR)
        runsDB = runsClient[settings.RUNS_DB_NAME][settings.RUNS_DB_COLLECTION]
        collections = list(mongoDB.collection_names())
        collections.sort(reverse=True)

        if len(collections) <= start:
            return HttpResponse({"runs": []}, content_type="application/json")

        for i in range(start, end):
            #for collection in collections:
            if i >= len(collections):
                break
            collection = collections[i]
            rundoc = runsDB.find_one({"name": collection, "detector": "tpc"})
            if rundoc is None:
                continue
            run_number = 0
            if "number" in rundoc:
                run_number = rundoc['number']
            available_runs.append({
                "number": run_number,
                "client": client,
                "collection": collection,
                "count": mongoDB[collection].find({
                    "data_type":"trigger_signals_histogram"
                }).count()
            })
    return HttpResponse(dumps({"runs": available_runs}), 
                        content_type="application/json")

def resize_arrs(data, max_size):
    
    xbin = 1
    fields = ["count_of_lone_pulses", "count_of_all_pulses"]
    for field in fields:
        
        if len(data[field]) < max_size:
            continue

        resize_factor = math.ceil(len(data[field]) / max_size)
        xbin = resize_factor
        newdata = []
        current_iter = 0
        newrow = [0]*len(data[field][0])
        for row in data[field]:
            
            if current_iter == resize_factor:                
                #for i in range(0, len(newrow)):
                #    newrow[i] = newrow[i] / current_iter
                newdata.append(newrow)
                newrow = [0]*len(data[field][0])
                current_iter = 0
            for i in range(0, len(newrow)):
                newrow[i] += (1/resize_factor)*row[i]
            current_iter+=1
            
        data[field] = newdata
    return xbin

#from jelle
def _flatten_trigger_monitor_data(data, new_format):

    matrix_fields = ['trigger_signals_histogram', 'count_of_2pmt_coincidences']

    for k in data.keys():
        if not len(data[k]):
            continue

        #if isinstance(data[k][0], dict):                                             
        # Dictionaries describing data                                                
        #    data[k] = pd.DataFrame(data['batch_info'])                               
        #data[k]                                                                      
        
        if k == 'trigger_signals':
            data[k] = np.concatenate(data[k])
        else:
            data[k] = np.vstack(data[k])
            
            if k in matrix_fields:
                n = np.sqrt(data[k].shape[1]).astype('int')
                data[k] = data[k].reshape((-1, n, n))


@login_required
def trigger_get_aggregate_data(request):
    """
    Go to each run and get all the trigger data. For each channel get the 
    average rate per run. Then return rate versus run (and time) for each channel.

    This function is computationally expensive... maybe. Basically extracting
    and computing rate per run *is* expensive, but we're also going to cache
    the extracted value in the collection to make the next call faster. There
    isn't really a better solution without setting something up offline.

    Aggregate doc format:
           type: 'aggregate'
           lone_pulses: array, 256 long, average lone pulse rate
           all_pulses: array, 256 long, average pulse rate
    """
    
    # In the future we could allow requests of various lengths. Right
    # now I'll hardcode the number of runs to look back to 50.
    # That should already kill it.
    n_runs = 50

    # Only really makes sense in background mode. Sources give false positive.
    allowed_modes = ['background_stable']

    runsClient = MongoClient(settings.RUNS_DB_ADDR)
    runsDB = runsClient[settings.RUNS_DB_NAME][settings.RUNS_DB_COLLECTION]
    runs_cursor = runsDB.find({"detector": "tpc", 
                               "reader.ini.name": {"$in": allowed_modes }, 
                               "end": {"$exists": True},
                           }).sort(number, -1).limit(n_runs)

    monClient = MongoClient("mongodb://"+settings.GEN_USER+":"+
                            settings.GEN_PW+"@"+client+"/"
                            +settings.GEN_DB)
    monDB = mongoClient["trigger_monitor"]
    monCollections = list(monDB.collection_names())

    ret_doc = {
        "run_numbers": [],
        "start_times": [],
        "lone_pulses": [],
        "all_pulses": []
    }

    for run_doc in runs_cursor:
    
        name = run_doc['name']
        if not name in monCollections:
            continue

        # Look for an "Aggregate" doc in the collection
        aggregate_doc = monDB[name].findOne({"type": "aggregate"})
        
        try:
            lone_pulses = aggregate_doc['lone_pulses']
            all_pulses = aggregate_doc['all_pulses']
        except:
            lone_pulses, all_pulses = aggregate_trigger_collection(name)
        
        # Fill ret doc
        if len(lone_pulses) == 0 or len(all_pulses) == 0:
            continue

        ret_doc['run_numbers'].append(doc['number'])
        ret_doc['start_times'].append(doc['start'])
        if len(ret_doc['lone_pulses']) == 0:
            ret_doc['lone_pulses'] = lone_pulses
        else:
            for i in range(0, len(ret_doc['lone_pulses'])):
                if i < len(lone_pulses):
                    ret_doc['lone_pulses'][i].append(lone_pulses[i])
        if len(ret_doc['all_pulses']) == 0:
            ret_doc['all_pulses'] = all_pulses
        else:
            for i in range(0, len(ret_doc['all_pulses'])):
                if i < len(all_pulses):
                    ret_doc['all_pulses'][i].append(all_pulses[i])

    return HttpResponse(json_util.dumps(ret_doc),
                        content_type="application/json")


def aggregate_trigger_collection(col_name):
    """
    Helper for trigger_get_aggregate_data. Adds all rows together and 
    puts summary doc after.
    """
    return

@login_required
def trigger_get_data(request):
    '''
    Refactor for new data format
    '''

    ret = {}
    matrix_fields = ['trigger_signals_histogram', 'count_of_2pmt_coincidences']
    data_types = {
        #'trigger_signals': datastructure.TriggerSignal.get_dtype(),                  
        'trigger_signals_histogram': np.float,
    }

    if request.method == "GET" and "run" in request.GET and "client" in request.GET:

        run = request.GET['run']
        client=request.GET['client']
        # Check if run is number. If so check if run exists
        if '_' not in run:
            try:
                runClient = MongoClient(settings.RUNS_DB_ADDR)
                runDB = runClient[settings.RUNS_DB_NAME]
                runColl = runDB[settings.RUNS_DB_COLLECTION]
                doc = runColl.find_one({ "number": int(run) })
                if doc is None:
                    return HttpResponse(json_util.dumps(
                        {"xbin": 0, "data": [], "error": "Invalid run"}),
                                        content_type="application/json")
                else:
                    run = doc['name']
            except Exception as e:
                return HttpResponse(json_util.dumps(
                    {"xbin": 0, "data": [], "error": "Can't reach runs DB " + 
                     str(e)}),
                                    content_type="application/json")

        # Now connect to our monitor DB
        mongoClient = MongoClient("mongodb://"+settings.GEN_USER+":"+
                                  settings.GEN_PW+"@"+client+"/"
                                  +settings.GEN_DB)
        mongoDB = mongoClient["trigger_monitor"]
        mongoCollection = mongoDB[run]
        total_data = collections.defaultdict(list)

        new_format = False
        for data_type in mongoCollection.distinct('data_type'):

            for doc in mongoCollection.find({"data_type": data_type}).sort("_id",1):
                d = None
                if 'data' in doc and ( type(doc['data']) == type([])):
                    new_format = True

                    # We can just do the addition here
                    for i in range(0, len(doc['data'])):
                        el = doc['data'][i]

                        # Check if we have a histogram
                        if type(el) == type([]):
                            if len(total_data[data_type]) == 0:
                                total_data[data_type] = doc['data']
                                break
                            for j in range(0, len(el)):
                                total_data[data_type][i][j] += el[j]
                        else:
                            #type(el) in [int, float]:
                            #if len(total_data[data_type]) == 0:
                            #    for e in doc['data']:
                            #        total_data[data_type].append([e])
                            #    break
                            total_data[data_type].append(doc['data'])
                            break
                            #total_data[data_type][i].append(el)
                            
                elif 'data' in doc:
                    d = np.fromstring(doc['data'],
                                      dtype=data_types.get(data_type, np.int))
                if d is not None:
                    total_data[data_type].append(d)
        #logger.error("FINISHED CLEARING")
        if not new_format:
            _flatten_trigger_monitor_data(total_data, new_format)
            #logger.error("FINISHED FLATTEN")

            # ADD HISTOGRAMS                                                              
            if len(total_data['count_of_2pmt_coincidences']) > 1:
                for i in range(1, len(total_data['count_of_2pmt_coincidences'])):
                    total_data['count_of_2pmt_coincidences'][0] = (
                        np.add(total_data['count_of_2pmt_coincidences'][0],
                               total_data['count_of_2pmt_coincidences'][i]))
                total_data['count_of_2pmt_coincidences'] = [ total_data['count_of_2pmt_coincidences'][0] ]
            if len(total_data['trigger_signals_histogram']) > 1:
                for i in range(1, len(total_data['trigger_signals_histogram'])):
                    total_data['trigger_signals_histogram'][0] = (
                        np.add(total_data['trigger_signals_histogram'][0],
                               total_data['trigger_signals_histogram'][i]))
                total_data['trigger_signals_histogram'] = [ total_data['trigger_signals_histogram'][0] ]


        # Get sum over whole run of raw and coincident pulses
        pulses = []
        lone_pulses = []
        for array_bin in total_data["count_of_lone_pulses"]:
            if len(lone_pulses) ==0:
                if type(array_bin) is list:
                    lone_pulses = array_bin
                else:
                    lone_pulses = array_bin.tolist()
            else:
                for i in range(0, len(array_bin)):
                    lone_pulses[i] += array_bin[i]
        for i in range(0, len(lone_pulses)):
            lone_pulses[i] = lone_pulses[i] / len(total_data['count_of_lone_pulses'])

        for array_bin in total_data["count_of_all_pulses"]:
            if len(pulses) ==0:
                if type(array_bin) is list:
                    pulses = array_bin
                else:
                    pulses = array_bin.tolist()
            else:
                for i in range(0, len(array_bin)):
                    pulses[i] += array_bin[i]
        for i in range(0, len(pulses)):
            pulses[i] = pulses[i] / len(total_data['count_of_all_pulses'])

        # Rebin big stuff
        max_size=1000.
        xbin = resize_arrs(total_data, max_size)


        # Convert np types
        for key in total_data:
            if isinstance(total_data[key], np.ndarray):
                total_data[key] = total_data[key].tolist()
            if len(total_data[key])>0 and isinstance(total_data[key][0], np.ndarray):
                for x in range(0, len(total_data[key])):
                    total_data[key][x] = total_data[key][x].tolist()
            if key =="batch_info":
                total_data[key]=[]
        ret = total_data

    try:

        json_ret = json_util.dumps({"xbin": xbin, "data": ret,
                                    "lone_pulses": lone_pulses,
                                    "all_pulses": pulses})
    except Exception as e:
        logger.error("Couldn't encode " + str(e))
        return HttpResponse({}, content_type="application/json")
    return HttpResponse(json_ret, content_type="application/json")


"""END TRIGGER SECTION"""

''' WAVEFORM DISPLAY '''

@login_required
def get_waveform_run_list(request):
    """
    Return all run names for runs on datamanager that can be accessed
    """
    
    retlist = []
    events = []
    query = {"detector": "tpc",
             "data": {"$elemMatch": {"host": "xe1t-datamanager",
                                     "status": "transferred",
                                     "type": "raw"
                                     }
                      },
             "source.type": {"$ne": "LED"},
             "trigger.events_built": {"$gt": 0},
             }
    returnvals = {"number": 1, "data": 1, "trigger.events_built": 1}
    cursor = runcollection.find(query, returnvals).sort("number", -1)
    for doc in cursor:
        # This because we have some crappy files with wrong permissions
        save=False
        for entry in doc['data']:
            if entry['host']=='xe1t-datamanager' and entry['type'] == 'raw':
                try:
                    stat_info = os.stat(entry['location'])
                    uid = stat_info.st_uid 
                    user = pwd.getpwuid(uid)[0]
                    if user=="transfer":
                        save=True
                except:
                    save=False
        if save:
            retlist.append(doc['number'])
            events.append(doc['trigger']['events_built'])
    return HttpResponse(dumps({'runs': retlist, 'events': events}), content_type="application/json")


@login_required                    
def get_event_as_json(request):       
    return HttpResponse(dumps(get_json_event(request)), content_type="application/json")

@login_required
def get_json_event(request):

    run = None
    if request.method == "GET" and "run" in request.GET:
        run = int(request.GET['run'])
    else:
        return {"error": "No run in request"}
    
    event_number = 0
    if "event" in request.GET:
        event_number = int(request.GET['event'])

    # Now load up pax and process the waveform. Warning: pax is a greedy bastard. He will
    # not hestitate to use ALL the RAM. Many requests at once will kill the server.
    rundoc = runcollection.find_one({"number": run})
    if rundoc is None:
        return {"error": "Couldn't find run in DB"}
    path = ""
    for entry in rundoc['data']:
        if entry['type'] == 'raw' and entry['host'] == 'xe1t-datamanager':
            path = entry['location']
    if path == "" or not os.path.exists(path):
        return {"error": "Data no longer on datamanager. You missed it."}

    if event_number > rundoc['trigger']['events_built']:
        return {"error": "Requested an event not in the run"}
    
    config = pax_config
    config['pax']['input_name'] = path
    config['pax']['events_to_process'] = [event_number]
    config['DEFAULT']['run_number'] = run

    # REMOVE LATER
    config['MongoDB']['host']='xenon1t-daq.lngs.infn.it'
    # END
    logger.error(config)
    processor = core.Processor(config_names="XENON1T", config_dict=config)
    logger.error("HERE")

    # There should just be one event
    for event in processor.get_events():
        logger.error("AGAIN")
        try:
            processed = processor.process_event(event)
        except:
            return HttpResponse({"error": "Exception thrown by pax trying to process your event"},
                                content_type="application/json")

    # Pack up the event
    logger.error("COMPRESSING")
    packed = CompressEvent(json_util.loads(processed.to_json()))
    logger.error("STRIPPING")
    ret = strip_doc(packed)  
    logger.error("RETURNING")
    ret['event_number'] = event_number

    processor.shutdown()
    
    return ret
    


def CompressEvent(event):
    """ Compresses an event by suppressing zeros in waveform in a way the frontend will understand  
    Format is the char 'zn' where 'z' is a char and 'n' is the number of following zero bins
    """

    for x in range(0, len(event['sum_waveforms'])):

        waveform = event['sum_waveforms'][x]['samples']
        zeros = 0
        ret = []

        for i in range(0, len(waveform)):
            if waveform[i] == 0:
                zeros += 1
                continue
            else:
                if zeros != 0:
                    ret.append('z')
                    ret.append(str(zeros))
                    zeros = 0
                ret.append(str(waveform[i]))
        if zeros != 0:
            ret.append('z')
            ret.append(str(zeros))
        event['sum_waveforms'][x]['samples'] = ret

    # Unfortunately we also have to remove the pulses or some events are huge                            
    del event['pulses']
    return event


def strip_doc(doc):
    trigger_time_ns = (doc['start_time'])
    timestring = time.strftime("%Y/%m/%d, %H:%M:%S", time.gmtime(trigger_time_ns / 10 ** 9))
    ret = {"event_date": timestring, "run_name": doc['dataset_name'], "event_number": doc["event_number"],
           "sum_waveforms": doc["sum_waveforms"], "peaks": [], "pulses": [], "all_hits": []}

    for peak in doc['peaks']:
        minpeak = {
            "area": peak["area"],
            "type": peak["type"],
            "left": peak["left"],
            "right": peak["right"],
            "index_of_maximum": peak["index_of_maximum"],
            "n_contributing_channels": peak['n_contributing_channels'],
            "area_per_channel": peak["area_per_channel"],
            "hits": [],
        }

        ret["peaks"].append(minpeak)
    
    for hit in doc['all_hits']:
        minhit = {
            "index_of_maximum": hit[5],
            "channel": hit[2],
            "area": hit[0],
            "left": hit[7],
            "right": hit[10],
            "found_in_pulse": hit[3],
        }
        ret["all_hits"].append(minhit)
    

    return ret
@login_required
def get_event_for_display(request):

    """
    Returns a full event as JSON. In case you want to treat differently from display one
    """
    asjson = dumps(get_json_event(request))
    logger.error("DUMPED")
    logger.error(sys.getsizeof(asjson))
    return HttpResponse(asjson, content_type="application/json")


def get_uptime(request):
    """
    Gets total uptime calculated from runs DB
    returns:    
    {'tpc': [
       { "month": int, 
         "day": int,
         "uptime": {
           "Cs137": .1,
           "DarkMatter": .6,
         }
       },
       ...
    ],
    "muon_veto": [same],
    }
    """
    last_days=30
    onlyDM=True
    if request.method != 'GET':
        return
    if 'dm' not in request.GET or request.GET['dm'] == False:
        onlyDM = False
    
    if 'this_month' in request.GET:
        last_days = date.today().day - 1

    # Make DB query
    runs_client = MongoClient(settings.RUNS_DB_ADDR)
    runsdb = runs_client[settings.RUNS_DB_NAME]

    runs_coll = runsdb[settings.RUNS_DB_COLLECTION]
    
    d = date.today() - timedelta(days=last_days)
    dt= datetime.datetime.combine(d, datetime.datetime.min.time())
    
    query_set=[]
    try:
        query_set = runs_coll.find({"start": 
                                    {"$gt": dt}}).sort("start", ASCENDING)
    except:
        logger.error("Exception trying to query runs DB")

    day_hist_tpc = []
    day_hist_muon_veto = []

    for doc in query_set:
        # figure out which bin this belongs in
        endtime = datetime.datetime.now()
        if "end" in doc.keys():
            endtime = doc['end']
        else:
            continue

        if doc['start'].day == endtime.day:
            incval = (endtime-doc['start']).seconds/(3600*24)
            bin_no = (doc['start']-datetime.datetime.combine(d,datetime.datetime.min.time())).days

            #logger.error(bin_no)
            if doc['detector'] == 'tpc':
                while bin_no >= len(day_hist_tpc):
                    day_hist_tpc.append({})
                #logger.error(bin_no)
                #logger.error(len(day_hist_tpc))
                if doc['reader']['ini']['name'] in day_hist_tpc[bin_no]:
                    day_hist_tpc[bin_no][doc['reader']['ini']['name']]+=incval
                else:
                    day_hist_tpc[bin_no][doc['reader']['ini']['name']]=incval
            if doc['detector'] == 'muon_veto':
                while bin_no >= len(day_hist_muon_veto):
                    day_hist_muon_veto.append({})
                if doc['reader']['ini']['name'] in day_hist_muon_veto[bin_no]:
                    day_hist_muon_veto[bin_no][doc['reader']['ini']['name']]+=incval
                else:
                    day_hist_muon_veto[bin_no][doc['reader']['ini']['name']]=incval
        else:
            stime = doc['start']
            while (endtime-stime).days>=0:
                midnight = datetime.datetime.combine(datetime.date(stime.year, stime.month, stime.day), datetime.datetime.max.time())
                if (endtime-stime).days==0:
                    midnight=endtime
                incval = (midnight-stime).seconds/(3600*24)
                bin_no = (stime-datetime.datetime.combine(d,datetime.datetime.min.time())).days
                if doc['detector'] == 'tpc':
                    while bin_no >= len(day_hist_tpc):
                        day_hist_tpc.append({})
                    if doc['reader']['ini']['name'] in day_hist_tpc[bin_no]:
                        day_hist_tpc[bin_no][doc['reader']['ini']['name']]+=incval
                    else:
                        day_hist_tpc[bin_no][doc['reader']['ini']['name']]=incval
                if doc['detector'] == 'muon_veto':
                    while bin_no >= len(day_hist_muon_veto):
                        day_hist_muon_veto.append({})
                    if doc['source']['type'] in day_hist_muon_veto[bin_no]:
                        day_hist_muon_veto[bin_no][doc['reader']['ini']['name']]+=incval
                    else:
                        day_hist_muon_veto[bin_no][doc['reader']['ini']['name']]=incval
                
                stime=stime + timedelta(days=1)
    ret_doc = {"tpc":[],"muon_veto":[]}
    for i in range(0, len(day_hist_tpc)):
        month = (d+timedelta(days=i)).month
        day = (d+timedelta(days=i)).day
        year = (d+timedelta(days=i)).year
        ret_doc['tpc'].append({"day": day, "month": month, "year": year,
                           "uptime": day_hist_tpc[i]})
        if i < len(day_hist_muon_veto):
            ret_doc['muon_veto'].append({"day":day, "month": month, "year": year,
                                         "uptime": day_hist_muon_veto[i]})
    
    if 'this_month' in request.GET:
        total = {}
        for entry in ret_doc['tpc']:
            for det in entry['uptime'].keys():
                if det not in total:                    
                    total[det] = 0.
                total[det] += entry['uptime'][det]
        for det in total.keys():
            total[det]/=last_days
        ret_total = {}
        for mode in total.keys():
            if total[mode] > 0.05:
                ret_total[mode] = total[mode]
            elif "other" not in ret_total:
                ret_total['other'] = total[mode]
            else:
                ret_total['other'] += total[mode]
            
        ret_doc = ret_total

    return HttpResponse(dumps(ret_doc), content_type="application/json")

@login_required
def get_calendar_events(request):
    '''
    Gets runs from database and puts into calendar format.
    Must take arguments "start" and "end" as ISO dates with
    format "2013-12-01" as a GET request
    '''

    if request.method != 'GET':
        return

    if "start" not in request.GET or "end" not in request.GET:
        return


    runs_client = MongoClient(settings.RUNS_DB_ADDR)
    rundb = runs_client[settings.RUNS_DB_NAME]
    run_coll = rundb[settings.RUNS_DB_COLLECTION]

    start_time = dateutil.parser.parse(request.GET['start'])
    end_time = dateutil.parser.parse(request.GET['end'])
    docs =[]
    try:
        docs = run_coll.find({
            "start": {"$gt": start_time,
                      "$lt": end_time  }
        })
    except:
        print("Error finding event")
        return HttpResponse({}, content_type="application/json")
    
    # format and return as http response
    retdoc = []
    for run in docs:
        endtimestamp = run['start']
        if "end" in run:
            endtimestamp = run["end"]
        newdoc={"source": run['source']['type'],
                    "runname": run['name'],
                    "start": run['start'].strftime("%Y-%m-%dT%H:%M:%S"),
                    "detector": run['detector'], 
                    "user": run['user'],
                    "end": endtimestamp.strftime("%Y-%m-%dT%H:%M:%S"),
        }        
        if run['detector'] == 'tpc':
            newdoc['title'] = "Run "+ str(run['number'])
        else:
            newdoc['title'] = "Run " + str(run['name'])
        retdoc.append(newdoc)

    return HttpResponse(dumps(retdoc), content_type="application/json")

#SCOPE BELOW


@login_required
def getWaveform(request):
    
    searchdict = {}
    if ( request.method == "GET" ):
        if "channel" in request.GET:
            for listing in settings.PMT_MAPPING:
                if listing['pmt_position'] == int(request.GET['channel']):
                    searchdict = {"module": listing['digitizer']['module'],
                                  "channel": listing['digitizer']['channel']}
    
    # OK let's make it smarter. We want to know where to look. 
    # Query the runs DB
    if "module" not in searchdict or "channel" not in searchdict:
        return HttpResponse({"ret":
                             "ERROR: No data found. Is the DAQ running?"},
                            content_type="application/json")
    # Get most recent runs doc
    runsClient = MongoClient(settings.RUNS_DB_ADDR)
    runsDB = runsClient[settings.RUNS_DB_NAME][settings.RUNS_DB_COLLECTION]
    try:
        newest_run = runsDB.find({"detector": "tpc"}).sort("number", -1).limit(1)[0]
    except:
        logger.error("Error getting newest run")
        return HttpResponse({"ret":
                             "ERROR: No data found. Is the DAQ running?"},
                            content_type="application/json")
        
    # Get reader
    reader = -1
    reader_ini = newest_run['reader']['ini']['boards']
    for board in reader_ini:
        if board["serial"] == str(searchdict['module']):
            reader = board['reader']
    if reader == -1:
        logger.error("Didn't find the reader")
        return HttpResponse({"ret":
                             "ERROR: Couldn't find which reader we need"},
                            content_type="application/json")
    
    # Get mongo
    hosts = newest_run['reader']['ini']['mongo']['hosts']
    if ("reader" + str(reader)) not in hosts:
        logger.error("Reader not in hosts")
        return HttpResponse({"ret":
                             "ERROR: Couldn't find which reader we need"},
                            content_type="application/json")
    mongo_addr = hosts[("reader"+str(reader))]
    mongo_addr = mongo_addr[10:]
    actual_mongo_addr = ( "mongodb://"+settings.BUFFER_USER+":"+settings.BUFFER_PW+
                          "@"+mongo_addr )

    try:
        server = MongoClient(actual_mongo_addr)
        database = server['untriggered']
    except:
        return HttpResponse({"ret": 
                             "ERROR: Database not found, is the server running?"},
                            content_type="application/json")
    
    # Find most recent collection
    collections=list(database.collection_names())
    collections.sort()
    if "status" in collections:
        collections.remove("status")
    collections = list(reversed(collections))
    logger.error(collections)
    if len(collections) == 0:
        return HttpResponse({"ret":
                             "ERROR: No collections found!"},
                            content_type="application/json")
    cl = collections[0].split("_")
    logger.error(cl)
    current_run = cl[0]+"_"+cl[1]
    highest_coll = int(cl[2])

    for coll in reversed(range(highest_coll)):
        collection = current_run + "_" + str(coll)
        cursor = database[collection].find(searchdict).limit(30)
        if cursor.count() < 10:
            continue

        logger.error(str(cursor.count()) + " events in collection " + collection)
        # Found something, fill ret dictionary
        retdict = {"collection": collection, "waveforms": [],
                   "ret": 'success'}
        for doc in cursor:
            # Get PMT position
            pmt=-1
            for listing in settings.PMT_MAPPING:
                if ( listing['digitizer']['module'] == doc['module'] and 
                     listing['digitizer']['channel'] == doc['channel'] ):
                    pmt = listing['pmt_position']
                    
            # Get time reset counter
            arr = collection.split("_")
            counter = int(arr[len(arr)-1])
            ttime = (counter * 2147483647) + doc['time'];
            
            # Put bins into dygraphs format
            intformat = np.frombuffer(doc['data'],np.int16)
            bins = []
            for i in range(0, len(intformat)):
                bins.append([i, int(intformat[i])])

            waveform = {"module": doc['module'],
                        "channel": doc['channel'],
                        "pmt": pmt,
                        "data": bins,
                        "time": ttime,
                        "rawtime": doc['time']
            }
            retdict['waveforms'].append(waveform)
        return HttpResponse(json_util.dumps(retdict), content_type="application/json")

    # Found nothing, failed
    return HttpResponse({"ret":
                         "ERROR: No data found. Is the DAQ running?"},
                        content_type="application/json")

