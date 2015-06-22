from django.shortcuts import HttpResponse
from pymongo import MongoClient
from bson.json_util import dumps
from django.contrib.auth.decorators import login_required
import datetime
import pytz
import numpy as np

@login_required
def GetStatusUpdate(request):

    """
    Gets the most recent Dispatcher status update
    :param request:
    :return: JSON dump of the mongo doc
    """

    # These options will be set somewhere else later?
    online_db_name = "online"
    runs_db_collection = "daq_status"
    mongodb_address = "localhost"
    mongodb_port = 27017

    # Connect to pymongo
    client = MongoClient(mongodb_address, mongodb_port)
    db = client[ online_db_name ]
    collection = db[ runs_db_collection ]

    detectors = collection.distinct("detector")
    ret = []
    for det in detectors:
        ret_doc = collection.find_one({"detector":det}, sort= [ ("_id", -1) ] )
        ret.append(ret_doc)
    print(ret)

    if len(ret) != 0:
        return HttpResponse( dumps(ret), content_type = 'application/json')

def GetNodeUpdates(request):

    """
    Gets to most recent update for each node
    :param request:
    :return:
    """
    # These options will be set somewhere else later?
    online_db_name = "online"
    runs_db_collection = "daq_rates"
    mongodb_address = "localhost"
    mongodb_port = 27017

    # Connect to pymongo
    client = MongoClient(mongodb_address, mongodb_port)
    db = client[ online_db_name ]
    collection = db[ runs_db_collection ]

    nodes = collection.distinct('node')

    ret = []
    for node in nodes:
        ret_doc = collection.find_one({"node":node}, sort=[("_id",-1)])
        ret.append(ret_doc)
    if len(ret) != 0:
        return HttpResponse( dumps(ret), content_type='application/json')

def GetNodeHistory(request):

    """
    Gets a list of all values for the node for the last time period (time period in request)
    :param request:
    :return:
    """

    # These options will be set somewhere else later?
    online_db_name = "online"
    runs_db_collection = "daq_rates"
    mongodb_address = "localhost"
    mongodb_port = 27017

    # Connect to pymongo
    client = MongoClient(mongodb_address, mongodb_port)
    db = client[online_db_name]
    collection = db[runs_db_collection]

    # Right now set nseconds to last 2 days. Will be a configurable query soon.
    nseconds = 48 * 60 * 60
    resolution = 100

    if request.method == "GET":
        if 'range' in request.GET.keys():
            nseconds = int(request.GET['range'])
        if 'bin' in request.GET.keys():
            resolution = int(request.GET['bin'])
    print(nseconds)
    # Get size of bins
    bin_size = resolution

    nowtime = datetime.datetime.now(datetime.timezone.utc)
    nowtime_seconds = (nowtime - datetime.datetime(1970,1,1, tzinfo=pytz.utc)).total_seconds()
    created_time = datetime.datetime.now( datetime.timezone.utc ) - datetime.timedelta(seconds=nseconds)

    nodes = collection.distinct('node')

    ret = []
    for node in nodes:

        # MongoDB query
        ret_docs = collection.find({"node":node, "createdAt": {"$gt": created_time}}).sort("timeseconds", 1)
        ret_list = []
        last_time = 0

        # Start at beginning of time range
        last_bin_start = nowtime_seconds - nseconds
        n_entries_bin = 0
        bin_total = 0.

        # Loop docs and pull data
        for doc in ret_docs:

            # If we're out of the last bin
            if doc['timeseconds'] > last_bin_start + bin_size:

                avg_rate = 0.
                time_value = last_bin_start + round(bin_size/2)

                # Record
                if n_entries_bin != 0:
                    avg_rate = bin_total / n_entries_bin
                    bin_total = 0.
                    n_entries_bin = 0.

                ret_list.append([1000*(time_value),avg_rate])

                while last_bin_start + bin_size < doc['timeseconds']:
                    last_bin_start += bin_size
                    if last_bin_start + bin_size < doc['timeseconds']:
                        ret_list.append( [1000*(round(last_bin_start + (bin_size/2))), 0.])

            bin_total += doc['datarate']
            n_entries_bin += 1.
            last_time = doc['timeseconds']

        # Fill the rest with zeros up to current time
        while nowtime_seconds-10 > last_time:
            last_time += bin_size
            ret_list.append([1000*(round(last_time)), 0.])
        ret.append( { "node": node, "data": ret_list } )
    if len(ret) != 0:
        return HttpResponse(dumps(ret), content_type="application/json")


@login_required
def start_run(request):

    """
    Requests a run start by writing a run start doc to the runs DB
    """

    # Check that request is valid
    if request.method != "POST":
        return


    insert_doc = {}



    # These options will be set somewhere else later?
    online_db_name = "online"
    runs_db_collection = "daq_control"
    mongodb_address = "localhost"
    mongodb_port = 27017

    # Connect to pymongo
    client = MongoClient(mongodb_address, mongodb_port)
    db = client[ online_db_name ]
    collection = db[ runs_db_collection ]

