from pymongo import MongoClient, ASCENDING, DESCENDING
from django.contrib.auth.decorators import login_required
from json import dumps, loads
from bson import json_util, objectid
from django.shortcuts import HttpResponse, HttpResponsePermanentRedirect
import logging
from django.conf import settings
import numpy as np
import math
import datetime

# Get an instance of a logger
logger = logging.getLogger("emo")

# Connect to pymongo
client = MongoClient(settings.NEW_MONITOR_DB_ADDR)
db = client[settings.NEW_MONITOR_DB_NAME]

@login_required
def get_run_list(request):
    runsClient = MongoClient(settings.RUNS_DB_ADDR)
    runsDB = runsClient[settings.RUNS_DB_NAME][settings.RUNS_DB_COLLECTION]

    available_runs = []
    collections = list(db.collection_names())
    collections.sort(reverse=True)
    
    for i in range(0, len(collections)):
        if i > 100:
            break
        cursor = db[collections[i]].find({"type": "status"})
        dtype="raw"
        devents=0
        dprescale=5
        finished=False
        if cursor.count() !=0:
            if "mode" in cursor[0]:
                dtype = cursor[0]['mode']
            if "prescale" in cursor[0]:
                dprescale = cursor[0]['prescale']
            if "finished" in cursor[0]:
                finished = cursor[0]['finished']
            devents = db[collections[i]].find().count()-1

        if db[collections[i]].count() > 10:
            rundoc = runsDB.find_one({"name": collections[i]})
            if rundoc is not None:
                available_runs.append({
                    "number": rundoc['number'],
                    "collection": collections[i],
                    "events": devents,
                    "type": dtype,
                    "prescale": dprescale,
                    "finished": finished
                })

    return HttpResponse(dumps({"runs": available_runs}),
                        content_type="application/json")

@login_required
def get_rdt(request):
    if ( request.method!= 'GET' or 'run' not in request.GET):
        return HttpResponse({},content_type="application/json")

    run = request.GET['run']

    # MongoDB Query                                                                   
    collection = db[run]
    data = collection.find({'x': {"$ne":None}, 'y':{"$ne":None}, 'dt':{"$ne":None}}, 
                           {'x': 1,'y':1,'dt':1})
    
    rret = []
    dtret = []
    for doc in data:
        if math.isnan(doc['x']) or math.isnan(doc['y']) or math.isnan(doc['dt']):
            continue
        rret.append(math.sqrt(math.pow(doc['x'],2)+math.pow(doc['y'],2)))
        dtret.append(doc['dt']/1000)

    return HttpResponse(json_util.dumps({"r":rret,"dt":dtret}),
                        content_type="application/json")

@login_required
def get_series_2d(request):
    
    if ( request.method!= 'GET' or 'x' not in request.GET or
         'y' not in request.GET or 'run' not in request.GET ):
        return HttpResponse({},content_type="application/json")

    x = request.GET['x']
    y = request.GET['y']
    run = request.GET['run']

    # MongoDB Query                                                                   
    collection = db[run]
    data = collection.find({x: {"$ne":None}, y:{"$ne":None}}, {x: 1,y:1})
    
    xret = []
    yret = []
    for doc in data:
        if math.isnan(doc[x]) or math.isnan(doc[y]):
            continue
        xret.append(doc[x])
        yret.append(doc[y])

    # Do scatter fit
    m = 0
    b = 0
    if x=="dt" and y=="s2":
        logy = []
        xfit=[]
        yfit=[]
        for i in range(0, len(yret)):
            dat = yret[i]
            logy.append(np.log(dat))

            if xret[i] > 50000 and np.log(dat) > 10 and xret[i]<600000:            
                yfit.append(np.log(dat))
                xfit.append(xret[i])
        m, b = np.polyfit(xfit,yfit,1)

    return HttpResponse(json_util.dumps({"x":xret,"y":yret, "m": m, "b": b}),
                        content_type="application/json")
    
def DoELFit(nowdts, nows2s, ret_times, ret_lifetimes, ret_errors, current_day):
    # Another way to do it                                                 
    thebins = []#[[], [], [], [], [], [], [], [], [], []]
    for x in range(0, len(range(50000, 575000, 25000))):
        thebins.append([])
    fity=[]
    for i in range(0, len(nowdts)):
        
        drift_time = nowdts[i]
        thebin = math.floor(drift_time / 25000 ) -2#50000) -1
        if thebin >= len(thebins) or thebin <0:
            continue
        thebins[thebin].append(nows2s[i])

    for j in range(0, len(thebins)):
        s2bin = thebins[j]
        hist, edges = np.histogram(s2bin, bins=np.arange(5, 20, 0.2))
        maxval = edges[np.argmax(hist)]
        fity.append(maxval)

    # Now fit her                                                          
    try:
        logger.error(len(fity))
        logger.error(len(range(50000, 550000, 25000)))
        out, cov = np.polyfit(range(50000, 575000, 25000),                            
                              fity, 1, cov=True, full=False)  
        #out, cov = np.polyfit(range(75000, 575000, 50000),
        #                      fity, 1, cov=True, full=False)
        m = out[0]
        err = cov[0][0]
        lifetime = 1/(-1000*m)
        error = lifetime*(np.sqrt(err)/(-1*m))

        if ( lifetime > 0 and not np.isnan(error)
             and not np.isnan(lifetime) and not error >= .5*lifetime ):
            ret_lifetimes.append(lifetime)
            ret_errors.append(error)
            ret_times.append((current_day-
                              datetime.datetime(1970,1,1)
                          ).total_seconds())
    except:
        logger.error("Error fitting")
    return ret_times, ret_lifetimes, ret_errors


@login_required
def get_elife_history(request):

    allowed_modes = ["background_stable", "background_gimped"]#, "cs137_stable", "cs137_gimped"]    
    days = 14

    if request.method != "GET":
        return HttpResponse({},content_type="application/json")
    if request.method == "GET" and "days" in request.GET:
        days = int(request.GET['days'])

    # First get the last 'runs' runs with modes in allowed_modes
    runsClient = MongoClient(settings.RUNS_DB_ADDR)
    runsDB = runsClient[settings.RUNS_DB_NAME][settings.RUNS_DB_COLLECTION]
    theruns = runsDB.find({"detector": "tpc", 
                          "reader.ini.name": {"$in": allowed_modes},
                           "start": {
                               "$gte": ( datetime.datetime.utcnow()-
                                        datetime.timedelta(days=days) )},
                       }).sort("number", 1)
    
    available_offline = db.collection_names()

    ret_times = []
    ret_lifetimes = []
    ret_errors = []
    today=0
    nows2s=[]
    nowdts=[]
    numdocs = theruns.count()
    idoc =0
    current_day = datetime.datetime.utcnow() - datetime.timedelta(days=days-today)

    for doc in theruns:
        idoc +=1

        #run is in offline monitor db
        if doc['name'] in available_offline:
           
            # Check which day this run is from. Is it from the current day?
            current_day = ( datetime.datetime.utcnow() - 
                            datetime.timedelta(days=days-today) )

            # While not we can increment the day we're looking at
            while doc['start'].date() != current_day.date() and today<=days:
                if len(nows2s)!=0 and len(nowdts)!=0:                    
                    logger.error(current_day)
                    logger.error(len(nows2s))
                    ret_times, ret_lifetimes, ret_errors = DoELFit(nowdts, nows2s, 
                                                                   ret_times, 
                                                                   ret_lifetimes, 
                                                                   ret_errors, 
                                                                   current_day)

                nows2s=[]
                nowdts=[]
                today+=1
                current_day = ( datetime.datetime.utcnow() - 
                                datetime.timedelta(days=days-today))

                            
            
            # Do the DB query and add to our histograms                            
            eldocs = db[doc['name']].find({"dt": {"$gt": 50000, "$lt": 600000}})
            for eldoc in eldocs:
                if np.log(eldoc['s2']) <= 10:
                    continue
                nows2s.append(np.log(eldoc['s2']))
                nowdts.append(eldoc['dt'])

    if len(nowdts)>0 and len(nows2s)>0:
        ret_times, ret_lifetimes, ret_errors = DoELFit(nowdts, nows2s,
                                                       ret_times,
                                                       ret_lifetimes,
                                                       ret_errors, 
                                                       current_day)

    return HttpResponse(dumps({"t": ret_times, "l": ret_lifetimes, "e": ret_errors}),
                        content_type="application/json")

                

@login_required
def get_hist_1d(request):
    
    # REQUEST contains
    # bins, min, max
    # run, var

    bins = 1000
    minimum = 0
    maximum = 1000
    run = 0
    var = "s1"

    if ( request.method != "GET" or 
         'bins' not in request.GET or 'min' not in request.GET or
         'max' not in request.GET or 'run' not in request.GET or
         'var' not in request.GET ):
        return HttpResponse({},content_type="application/json")
    
    bins = int(request.GET['bins'])
    minimum = float(request.GET['min'])
    maximum = float(request.GET['max'])
    run = request.GET['run']
    var = request.GET['var']

    # MongoDB Query
    collection = db[run]
    data = collection.find({var: {"$ne":None}}, {var: 1})
    hdata = []
    for doc in data:
        hdata.append(doc[var])
    h, b = np.histogram(hdata, bins, (minimum,maximum))
    retdata = {
        "bins": b.tolist(),
        "hist": h.tolist()
    }

    return HttpResponse(json_util.dumps(retdata),
                        content_type="application/json")


@login_required
def get_event_rate_history(request):
    runs = 100

    if request.method != "GET" or "run" not in request.GET:
        return HttpResponse({},content_type="application/json")
    run = request.GET['run']
    if request.method == "GET" and "runs" in request.GET:
        runs = int(request.GET['runs'])

    # First get this run's number
    runsClient = MongoClient(settings.RUNS_DB_ADDR)
    runsDB = runsClient[settings.RUNS_DB_NAME][settings.RUNS_DB_COLLECTION]
    therun = runsDB.find_one({"name": run, "detector": "tpc"})

    if therun is None or "number" not in therun:
        return HttpResponse({},content_type="application/json")
    runno = therun['number']    

    # Get last n runs
    lastn = runsDB.find({"number": {"$lte": runno}}).sort("number", -1).limit(runs)

    # Return data
    #{ time: timeseconds, rate: events_built/(end-start), halftime: (end-start)/2}
    retvals = {} #{"times": [], "events": [], "halftimes": []}
    for doc in lastn:
        if 'end' not in doc: 
            continue
        runlength = (doc['end']-doc['start']).total_seconds()
        epoch = datetime.datetime.utcfromtimestamp(0)
        runtime = (doc['start']-epoch).total_seconds() + runlength/2
        events=0
        try:
            events = doc['trigger']['events_built']
        except:
            print("No events")
        if doc['reader']['ini']['name'] not in retvals:
            retvals[doc['reader']['ini']['name']] = {"times": [], "events": [],
                                                     "halftimes": []}

        retvals[doc['reader']['ini']['name']]['times'].append(runtime)
        retvals[doc['reader']['ini']['name']]['events'].append(events/runlength)
        retvals[doc['reader']['ini']['name']]['halftimes'].append(runlength/2)

    return HttpResponse(json_util.dumps(retvals),content_type="application/json")
        
    
@login_required
def get_event_rates(request):
    
    if request.method != "GET" or "run" not in request.GET:
        return HttpResponse({},content_type="application/json")
    run = request.GET['run']

    collection = db[run]
    try:
        min_time = collection.find({"type":"data"}, {'interactions': 1, 'time':1}).sort("time", 1)[0]['time']
        max_time = collection.find({"type":"data"}, {'interactions': 1, 'time':1}).sort("time", -1)[0]['time']-min_time
    except:
        return HttpResponse({},content_type="application/json")

    data = collection.find({"type": "data"},{'interactions': 1, 'time':1}).sort("time", -1)

    logger.error(min_time)
    logger.error(max_time)
    # We want either 1 second bins, or 1000 bins
    max_time_int = int((max_time) / 1e9)
    bin_size = 1
    if max_time_int > 1000:
       bin_size = max_time_int / 1000 + 1
    events = []
    interactions = []
    prescale=5

    # Try to get the real prescale
    try:
        cursor = collection.find({"type": "status"})
        prescale = cursor[0]['prescale']
    except:
        # Either no cursor, no doc, or no field. I don't care
        prescale =5

    for doc in data:
        thebin = int(((doc['time']-min_time)/1e9)/bin_size)
        while thebin >= len(events):
            events.append(0)
        while thebin >= len(interactions):
            interactions.append(0)
        events[thebin] += 1
        if doc['interactions']!=0:
            interactions[thebin]+=1
    retevents=[]
    retint=[]
    for e in events:
        retevents.append(prescale*e*(1/bin_size))
    for i in interactions:
        retint.append(prescale*i)
    return HttpResponse(json_util.dumps({"events": retevents, 
                                         "interactions": retint,
                                        "min_time": min_time, "bin_size": bin_size}),
                        content_type="application/json")


'''
#
##
###
####
##### NEW PAGE
####
###
##
#
'''

@login_required
def get_modes_in_range(request):
    '''
    We send some selection criteria, we return a list of run modes
    in that range of runs. 
    '''
    
    if request.method != 'GET':
        return HttpResponse({},content_type="application/json")

    query = {"detector": "tpc"}
    limit = -1
    if "lastn" in request.GET:
        limit = int(request.GET['lastn'])
    elif "startrun" in request.GET:
        query['number'] = {"$gte": int(request.GET['startrun'])}
        if "endrun" in request.GET:
            query['number']['$lte'] = int(request.GET['endrun'])
    elif "startdate" in request.GET and "enddate" in request.GET:
        query['start'] = {"$gte": 
                          datetime.datetime.combine(
                              datetime.date.fromtimestamp(
                                  int(request.GET['startdate'])), 
                              datetime.datetime.min.time()),
                          "$lte": 
                          datetime.datetime.combine(
                              datetime.date.fromtimestamp(
                                  int(request.GET['enddate'])),
                              datetime.datetime.max.time())}
    filtermodes = []
    try:
        for mode in request.GET.getlist('modes[]'):
            filtermodes.append(mode)
    except:
        print("I guess no modes")

    runsClient = MongoClient(settings.RUNS_DB_ADDR)
    runsDB = runsClient[settings.RUNS_DB_NAME][settings.RUNS_DB_COLLECTION]
    
    collections = list(db.collection_names())

    # Query for runs
    if len(filtermodes) > 0:
        query['reader.ini.name'] = {"$in": filtermodes}
        if limit == -1:
            cursor = runsDB.find(query, {"name": 1})
        else:
            cursor = runsDB.find(query, {"name": 1}).sort("number", -1).limit(limit)
        ret = []
        for doc in cursor:
            if ( doc['name'] in collections ):
                ret.append(doc['name'])
        return HttpResponse(dumps(ret),content_type="application/json")


    # Query for modes
    if limit == -1:
        cursor = runsDB.find(query, {"name": 1, "reader.ini.name": 1})
    else:
        cursor = runsDB.find(query, {"name": 1, "reader.ini.name": 1}).sort("number", -1).limit(limit)
        
    modes = []
    for doc in cursor:
        if ( doc['name'] in collections and 
             doc['reader']['ini']['name'] not in modes ):
            modes.append(doc['reader']['ini']['name'])
    return HttpResponse(dumps(modes),content_type="application/json")


@login_required 
def get_plot_xy(request):
    
    if request.method != "POST":
        return HttpResponse(dumps({}),content_type="application/json")
    
    logger.error(request.POST)
    ret = {"did": "it"}
    keys = None
    xret = [] 
    yret = []
    try:
        runlist = request.POST.getlist('runs[]')
        x = request.POST['x']
        y = request.POST['y']
    except Exception as e:
        logger.error(str(e))
        return HttpResponse(dumps({}),content_type="application/json")

    for collection in runlist:
        if keys == None:
            keys = list(db[collection].find_one({"type": "data"}).keys())
            keys.append('r')    
            
        query = {}
        limiter = {}
        nancheck = []
        if x != 'r':
            query[x] = {"$ne":None}
            limiter[x] = 1
            nancheck.append(x)
        else:
            query = {"x": {"$ne": None}, "y": {"$ne": None}}
            limiter['x'] = 1
            limiter['y'] = 1
            nancheck.append("x")
            nancheck.append("y")
        if y != 'r':
            query[y] = {"$ne":None}
            limiter[y] = 1
            nancheck.append(y)
        else:
            query["x"] = {"$ne": None}
            query["y"] = {"$ne": None}
            limiter['x'] = 1
            limiter['y'] = 1
            nancheck.append('x')
            nancheck.append('y')
            
        data = db[collection].find(query, limiter)
        for doc in data:

            skip = False
            for var in nancheck:
                if math.isnan(doc[var]):
                    skip=True
            if skip:
                continue
                
            if x != 'r':
                xret.append(doc[x])
            else:
                xret.append(np.sqrt(pow(doc['x'],2)+pow(doc['y'],2)))
            if y != 'r':
                yret.append(doc[y])
            else:
                yret.append(np.sqrt(pow(doc['x'],2)+pow(doc['y'],2)))
                
    ret = {"x": xret, "y": yret, "vars": keys}
        
    return HttpResponse(dumps(ret),
                        content_type="application/json")

@login_required
def select_runs(request):

    if request.method != "POST":
        return HttpResponse(dumps({}),content_type="application/json")

    logger.error(request.POST)
    colls = []
    try:
        for coll in request.POST.getlist('runs[]'):
            colls.append(coll)
    except:
        return HttpResponse(dumps({}),content_type="application/json")

    ret = {}
    events = 0
    for coll in colls:
        if coll in db.collection_names():            
            events+=db[coll].count()
    ret = {"collections": len(colls), "events": events}

    return HttpResponse(dumps(ret),content_type="application/json")

    

    
