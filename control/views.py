from django.shortcuts import HttpResponse
from pymongo import MongoClient
import pymongo
from bson.json_util import dumps, loads
import json
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from control.models import RunStartForm, RunStopForm
import datetime
from pytz import timezone
import pytz
import math
import numpy as np
import pandas as pd
from django.conf import settings
import logging
import requests
import urllib

# Get an instance of a logger
logger = logging.getLogger('emo')


client = MongoClient(settings.ONLINE_DB_ADDR)
logclient = MongoClient(settings.LOG_DB_ADDR)

@login_required
def GetTPCEventRate(request):
    """
    Get most recent trigger data collection and some other stuff
    """

    # Connect to trigger monitor and get most recent collection info
    monClient = MongoClient("mongodb://"+settings.GEN_USER+":"+
                            settings.GEN_PW+"@gw:27018"+"/"
                            +settings.GEN_DB)
    monDB = monClient["trigger_monitor"]
    try:
        monCollections = list(monDB.collection_names())        
        monCollections.sort(reverse=True)
        newest = monCollections[0]
    except:
        return HttpResponse(dumps({}),
                            content_type="application/json")


    client = MongoClient(settings.RUNS_DB_ADDR)
    runsDB = client[ settings.RUNS_DB_NAME ][settings.RUNS_DB_COLLECTION]
    pipelineDB = client[ settings.RUNS_DB_NAME ]["pipeline_status"]

    # Defaults
    retdoc = {
        "deadtime": None, "rate": None, "time": None, "rname": None, 
        "deadtime_total": None, "deadtime_run": None,
        "rnumber": None, "eb0": { "storageSize": 0, "dataSize": 0, "collections": 0},
        "eb1": { "storageSize": 0, "dataSize":0, "collections": 0},
        "eb2": { "storageSize": 0, "dataSize":0, "collections": 0},
        "eventbuilder_info": None, "deleter_timestamp": None
    }
    
    # Grab the most recent deleter doc and record the time
    try:
        deleterdoc = list(pipelineDB.find({"name": "deleter"}).sort("time", -1).limit(1))[0]
        retdoc['deleter_timestamp'] = deleterdoc['time']
    except Exception as E:
        logger.error(str(E))
        retdoc['deleter_timestamp'] = None

    # Get most recent status doc
    rnum = newest
    rnumbackup=monCollections[1]
    try:
        for collection in monCollections:            
            doc = monDB[collection].find_one({"data_type": "batch_info"},
                                             sort=[("_id", -1)])
            newest = collection
            rundoc = runsDB.find_one({"name": newest, "detector": "tpc"})

            if doc is not None and rundoc is not None: 
                break
            
        if doc is not None:
            rnum = newest
            start = rundoc['start']
            timestamp = (start - datetime.datetime(1970,1,1)).total_seconds()
            retdoc['rate'] = doc['events_built']/21.
            retdoc['time'] = str(timestamp+doc['last_time_searched']/1000000000.),
            retdoc['rname'] = rnum
            retdoc['rnumber'] = rundoc['number']
    except Exception as e:
        logger.error("Error status:" + str(e)+" "+str(newest))
        
    try:
        dead_time_doc = monDB[newest].find({"data_type": 
                                            "dead_time_info"}).sort("_id", -1)[0]
        time_bin = monDB[newest].find({"data_type":
                                       "dead_time_info"}).sort("_id", 
                                                               1)[0]['time']
        retdoc['deadtime'] = dead_time_doc['busy'] / time_bin
        try:
            retdoc['deadtime_run'] = newest
        except:
            retdoc['deadtime_run'] = -1
        dead_time_doc = (list(monDB[newest].aggregate([
            {"$match": {"data_type": "dead_time_info", "busy": {"$ne": 0}}}, 
            {"$group": {"_id": None,  "count": {"$sum": "$busy"}, 
                        "tot": {"$max": "$time"}}}, 
            {"$project": {"deadtime": {"$divide": ["$count", "$tot"]}, 
                          "busytime": "$count", "totaltime": "$tot"}}])))[0]
        retdoc['deadtime_total'] = dead_time_doc['deadtime']
    except Exception as e:
        logger.error("Error deadtime run:" + str(e))
        
    # Pipeline status this run
    try:
        dead_time_doc = pipelineDB.find(
            {"name": "daq_buffer"}).sort("time", -1).limit(1)[0]
        retdoc['eb0:27000'] = dead_time_doc["eb0:27000"]
        retdoc['eb1:27000'] = dead_time_doc["eb1:27000"]
        retdoc['eb2:27000'] = dead_time_doc["eb2:27000"]        
    except Exception as e:
        logger.error("Error deadtime: " + str(e))

    # Eventbuilder queue and checkin
    try:
        ebdoc = pipelineDB.find({'name': 
                                 'eventbuilder_info'}).sort("time",-1).limit(1)[0]
        retdoc['eventbuilder_info'] = ebdoc
        retdoc['eventbuilder_info']['time'] = (retdoc['eventbuilder_info']['time']- datetime.datetime(1970,1,1)).total_seconds()

    except Exception as e:
        logger.error("Error pipeline: " + str(e))

    return HttpResponse(dumps(retdoc),
                        content_type="application/json")



@login_required
def GetQueueList(request):
    """
    Gets the queue as a json list
    """
    # Get currently running run

    # Connect to pymongo                                                              
    db = client[ settings.ONLINE_DB_NAME ]
    collection_status = db[ "daq_status" ]
    detectors = ["tpc","muon_veto"]

    queue = []
    pos = -1
    
    '''
    for det in detectors:        
        ret_doc = collection_status.find_one({"detector":det}, sort= [ ("_id", -1) ] )
        if ret_doc['state'] == "Running":
            queue.append({
                "running": 1,
                "detector": ret_doc['detector'],
                'user': ret_doc['startedBy'],
                'run_mode_'+det: ret_doc['mode'],
                'stop_after_minutes': -1,
                'position': pos
            })
            pos -= 1
    '''

    # Connect to pymongo  
    collection = db['daq_queue']
    #queue = []
    try:
        cursor = collection.find().sort("position", pymongo.ASCENDING)
        for doc in cursor:
            #doc['running'] = 0
            queue.append(doc)
    except:
        HttpResponse( dumps([]), content_type = 'application/json')
    
    return HttpResponse( dumps(queue), content_type = 'application/json')

@login_required
@csrf_exempt
def UpdateQueueList(request):
    
    if request.method != "POST":
        return HttpResponse({})

    # Connect to pymongo                                                              
    db = client[ settings.ONLINE_DB_NAME ]
    collection = db['daq_queue']
    
    # Drop current collection
    try:
        collection.drop()
    except:
        logger.error("Unable to drop collection in queue update.")
        return HttpResponse({})

    # Had to disable csrf because couldn't figure out how to put in json
    pythondict = loads( request.body.decode('utf-8') )
    
    n=0
    for doc in pythondict['queue']:
        doc['position'] = n
        collection.insert_one(doc)
        n+=1
    #logger.error("Updated queue with following settings")
    #logger.error(pythondict)
    return HttpResponse(status=200)


@login_required
def GetStatusUpdate(request):

    """
    Gets the most recent Dispatcher status update and searches to log to see
    if there are open issues. Run in main event loop.
    :param request:
    :return: JSON dump of the mongo doc
    """
    # Connect to pymongo
    db = client[ settings.ONLINE_DB_NAME ]
    
    collection = db[ "daq_status" ]

    detectors = ["tpc","muon_veto"]
    #detectors = collection.distinct("detector")
    ret = []
    for det in detectors:
        ret_doc = collection.find_one({"detector":det}, sort= [ ("_id", -1) ] )
        ret.append(ret_doc)
    
    retdict = {"status": ret}

    logdb = logclient[settings.LOG_DB_NAME]

    logcollection = logdb["log"]
    if logcollection.find({"priority": {"$gt": 1, "$lt": 5}}).count() != 0:
        retdict["issues"] = True
    else:
        retdict["issues"] = False

    #client.close()
    if len(ret) != 0:
        return HttpResponse( dumps(retdict), content_type = 'application/json')

@login_required
def GetNodeUpdates(request):

    """
    Gets to most recent update for each node
    :param request:
    :return:
    """

    # Connect to pymongo
    #client = MongoClient(settings.ONLINE_DB_ADDR)
    db = client[ settings.ONLINE_DB_NAME ]
    #if settings.MONGO_USER != "":
    #    db.authenticate(settings.MONGO_USER, settings.MONGO_PW, mechanism='SCRAM-SHA-1')

    collection = db[ "daq_rates" ]

    nodes = ["reader0", "reader1", "reader2", "reader3", "reader4", "reader5", "reader6", "reader7"]
    #nodes = collection.distinct('node')

    ret = []
    for node in nodes:
        ret_doc = collection.find_one({"node":node}, sort=[("_id",-1)])
        ret_doc['date'] = datetime.datetime.now()
        ret.append(ret_doc)
    #client.close()
    if len(ret) != 0:
        return HttpResponse( dumps(ret), content_type='application/json')

@login_required
def GetNodeHistory(request):

    """
    Gets a list of all values for the node for the last time period (time period in request)
    :param request:
    :return:
    """

    # Connect to pymongo
    #client = MongoClient(settings.ONLINE_DB_ADDR)
    db = client[ settings.ONLINE_DB_NAME ]
    
    collection = db[ "daq_rates" ]

    # Right now set nseconds to last 2 days. Will be a configurable query soon.
    nseconds = 48 * 60 * 60
    resolution = 100

    variable = 'datarate'
    if request.method == "GET":
        if 'range' in request.GET.keys():
            nseconds = int(request.GET['range'])
        if 'bin' in request.GET.keys():
            resolution = int(request.GET['bin'])
        if 'var' in request.GET.keys():
            variable = str(request.GET['var'])

    # Get size of bins
    bin_size = resolution
    
    nowtime = datetime.datetime.now(datetime.timezone.utc)
    nowtime_seconds = (nowtime - datetime.datetime(1970,1,1, 
                                                   tzinfo=pytz.utc)).total_seconds()
    created_time = datetime.datetime.now( datetime.
                                          timezone.utc ) - datetime.timedelta(
                                              seconds=nseconds)
    
    #nodes = collection.distinct('node')    
    nodes = ["reader0", "reader1", "reader2", "reader3", "reader4", "reader5", "reader6", "reader7"]

    dataframe = pd.DataFrame(list(collection.find({"createdAt": 
                                                   {"$gt": created_time}})))
    dataframe['datetime'] = pd.to_datetime(dataframe['timeseconds'], unit='s')
    ret = []
    for node in pd.unique(dataframe.node.ravel()):
        subtable = dataframe[dataframe.node==node].set_index('datetime')
        subtable = subtable.resample(str(bin_size)+'s', how='mean')
        subtable['timeseconds'] = subtable['timeseconds'].multiply(1000)
        thelist = []
        for item in subtable[['timeseconds',variable]].values.tolist():
            if math.isnan(item[0]) or not item[0]>=0 or math.isnan(item[1]):
                continue
            thelist.append(item)
        #ret.append({ "node": node, "data": 
        #             list(subtable[['timeseconds','datarate']].values.tolist())})
        ret.append({"node": node, "data": thelist})
            
    #client.close()
    
    if len(ret) != 0:
        return HttpResponse(dumps(ret), content_type="application/json")

@login_required
@csrf_exempt
def stop_run(request):

    """
    Sends a stop command
    """    
    # Check that request is there
    if request.method != "POST":
        return HttpResponse({})

    #rs_form = RunStopForm(request.POST)
    #if not rs_form.is_valid():
    #    return HttpResponse({})

    pythondict = loads( request.body.decode('utf-8') )
    logger.error(pythondict)
    insert_doc = {}
    insert_doc['command'] = "Stop"
    insert_doc['detector'] = pythondict['detector']#rs_form.cleaned_data['detector']
    insert_doc['user'] = pythondict['user']#rs_form.cleaned_data['user']
    if 'comment' in pythondict:
        insert_doc['comment'] = pythondict['comment']
    #insert_doc['comment'] = rs_form.cleaned_data['comment']

    # Connect to pymongo                                                         
    #client = MongoClient(settings.ONLINE_DB_ADDR)
    db = client[ settings.ONLINE_DB_NAME ]

    collection = db[ "daq_control" ]
    collection.insert_one(insert_doc)
    return HttpResponse({})

@login_required
def GetDispatcherReply(request):

    # Connect to pymongo                                                            
    #client = MongoClient(settings.ONLINE_DB_ADDR)
    db = client[ settings.ONLINE_DB_NAME ]

    collection = db[ "dispatcherreply" ]    
    cursor = collection.find({}).sort("_id", 1)
    
    retdict = {}
    if cursor.count() > 0:
        retdict = {"messages": []}

        for doc in cursor:
            retdict['messages'].append({"message": doc["message"],
                                        "replyenum": doc["replyenum"]})
            if (datetime.datetime.now(datetime.timezone.utc) - 
                doc['_id'].generation_time.replace(tzinfo=pytz.utc)).seconds > 15:
                collection.delete_one({"_id": doc['_id']})
            
            if (doc['replyenum'] == 19 and hasattr(settings, 'GITTER_URL') 
                and settings.GITTER_URL is not None):
                url = settings.GITTER_URL
                payload = {'message': doc['message']}
                headers = {'content-type': 'application/json', 
                           'Accept-Charset': 'UTF-8'}
                try:
                    r = requests.post(url, data=json.dumps(payload), headers=headers)
                except:
                    print("Logging to gitter failed")
    return HttpResponse(dumps(retdict), content_type="application/json")

    

@login_required
def start_run(request):

    """
    Requests a run start by writing a run start doc to the runs DB
    """
    
    # Check that request is valid
    if request.method != "POST":
        return HttpResponse({})
    rs_form = RunStartForm(request.POST)
        
    if rs_form.is_valid():

        insert_doc = {}
        
        # Want to check which detectors this command is for
        hasTPC = False
        hasMV = False

        insert_doc['force'] = False

        # Make the insert doc
        for key in rs_form.cleaned_data.keys():
            #if key == 'run_mode_tpc' and rs_form.cleaned_data[key] != "":
            if key == 'detector' and (rs_form.cleaned_data[key]=='tpc' 
                                      or rs_form.cleaned_data[key]=='all'):
                hasTPC = True
            #elif key == 'run_mode_mv' and rs_form.cleaned_data[key] != "":  
            elif key == 'detector' and (rs_form.cleaned_data[key]=='muon_veto'
                                        or rs_form.cleaned_data[key]=='all'):
                hasMV = True
            insert_doc[key] = rs_form.cleaned_data[key]
            
        # Connect to pymongo                                                        
        #client = MongoClient(settings.ONLINE_DB_ADDR)
        db = client[ settings.ONLINE_DB_NAME ]

        run_collection = db['run_modes']

        print(insert_doc)
        # Do the run mode stuff
        if hasTPC:
            if "baselines_tpc" in insert_doc:
                if insert_doc["baselines_tpc"] == True:
                    run_collection.find_one_and_update({"name": 
                                                    insert_doc['run_mode_tpc']},
                                                   {"$set":{"baseline_mode": 1}})
                else:
                    run_collection.find_one_and_update({"name":
                                                    insert_doc['run_mode_tpc']},
                                                   {"$set":{"baseline_mode": 0}})

            if "noise_tpc" in insert_doc:
                if insert_doc['noise_tpc'] == True:
                    run_collection.find_one_and_update({"name":
                                                    insert_doc['run_mode_tpc']},
                                                   {"$set":{"noise_spectra_enable": 1}})
                else:
                    run_collection.find_one_and_update({"name":
                                                    insert_doc['run_mode_tpc']},
                                                   {"$set":{"noise_spectra_enable": 0}})
        if hasMV:
            if "baselines_mv" in insert_doc:
                if insert_doc["baselines_mv"] == True:
                    run_collection.find_one_and_update({"name":
                                                    insert_doc['run_mode_mv']},
                                                   {"$set":{"baseline_mode": 1}})
                else:
                    run_collection.find_one_and_update({"name":
                                                    insert_doc['run_mode_mv']},
                                                   {"$set":{"baseline_mode": 0}})
            if "noise_mv" in insert_doc:
                if insert_doc['noise_mv'] == True:
                    run_collection.find_one_and_update({"name":
                                                    insert_doc['run_mode_mv']},
                                                   {"$set":{"noise_spectra_enable": 1}})
                else:
                    run_collection.find_one_and_update({"name":
                                                    insert_doc['run_mode_mv']},
                                                   {"$set":{"noise_spectra_enable": 0}})

        # Which detector?
        if hasTPC and hasMV:
            insert_doc['detector'] = 'all'
        elif hasTPC:
            insert_doc['detector'] = 'tpc'
        elif hasMV:
            insert_doc['detector'] = 'muon_veto'
        else:
            return HttpResponse({})
        insert_doc['command'] = "Start"

        # Clear reply collection
        reply_collection = db[ "dispatcherreply" ]
        reply_collection.drop()


        collection = db[ "daq_control" ]
        #collection.insert_one(insert_doc)
        
        # Here you want to query to get the position ID (to put this one at end)
        queue = db['daq_queue']        
        
        # Find the largest position in the queue
        cursor = queue.find()
        largest_pos = 0
        for doc in cursor:
            if doc['position'] > largest_pos:
                largest_pos = doc['position']
        largest_pos+=1
        for i in range(0, insert_doc['repeat_n_times']):
            newdoc = CopyDoc(insert_doc)
            newdoc['position'] = largest_pos+i
            queue.insert_one(newdoc)
        

        return HttpResponse({})
        
    return HttpResponse({})

def CopyDoc(doc):
    newdoc = {}
    for field in doc:
        if field != "_id":
            newdoc[field] = doc[field]
    return newdoc
