from django.shortcuts import render
from django.http import HttpResponsePermanentRedirect, HttpResponse
from pymongo import MongoClient
from django.conf import settings
from django.contrib.auth.decorators import login_required
from bson.json_util import dumps
import datetime
import logging
logger = logging.getLogger('emo')

# This should later go in the DB itself
descriptions = {
    "pfeiffer_id": "Pump timestamp output",
    "cryostat_vacuum": "Vacuum reading in cryostat",
    "p2": "Pressure of xenon in the recuperating system (atm)",
    "omega_id": "Omega timestamp output",
    "p1": "Pressure of xenon gas inside the  detector (atm)",
    "lakeshore_id": "Lakeshore timestamp output",
    "cold_finger": " The temperature of the coldfinger, which is the temperature on the heatlink between the PTR and the cell",
    "heater": "Power needed to keep the cell at a constant temperature, percentage of max voltage",
    "baking_pt100_3": "Cooling water temperature for He compressor",
}

c = MongoClient(settings.SC_DB_ADDR)
d = c[settings.SC_DB_NAME]

@login_required
def get_sensor_newest(request):
    
    detector = 'xenon100'
    if request.method=="GET" and "detector" in request.GET:
        detector = request.GET['detector']        
    mongo_collection = d['slow_control']

    cur = mongo_collection.find({"detector": detector}, sort= [ ("_id", -1) ], limit=1)
    if cur.count() >= 1:
        newest = cur[0]
        #newest['key'] = descriptions
        retdict = { "time": newest['time'], 'categories': {}}
        for sensor in newest['sensors']:
            if sensor['category'] not in retdict['categories'].keys():
                retdict['categories'][sensor['category']] = []
            retdict['categories'][sensor['category']].append(sensor)

        return HttpResponse(dumps(retdict), content_type="application/json")
    return HttpResponse("")

@login_required
def get_sensor_history(request):
    
    max_points = 500
    req_sensor = "" #all
    detector='xenon100'
    # include here some GET for filtering sensor/number of points    
    if request.method == "GET":
        if 'sensor' in request.GET:
            req_sensor = request.GET['sensor']
        if 'events' in request.GET:
            max_points = int(request.GET['events'])
        if 'detector' in request.GET:
            detector = request.GET['detector']
    mongo_collection = d['slow_control']
    cursor = mongo_collection.find({"detector": detector}, 
                                   sort= [ ("_id", -1) ], limit=max_points)
    retdoc = {}
    for doc in cursor:
        for i in range(0, len(doc['sensors'])):
            sensor = doc['sensors'][i]
            if req_sensor != "" and req_sensor!=sensor['name']:
                continue
            if sensor['name'] in retdoc.keys():
                retdoc[sensor['name']].append([(doc['time']-datetime.datetime(1970,1,1))/datetime.timedelta(seconds=1)*1000, sensor['value']])
            else:
                retdoc[sensor['name']] = [[ (doc['time']-datetime.datetime(1970,1,1))/datetime.timedelta(seconds=1)*1000, sensor['value'] ]]
    reversed_doc = {}
    for sensor in retdoc.keys():
        reversed_doc[sensor] = list(reversed(retdoc[sensor]))
    return HttpResponse(dumps(reversed_doc), content_type="application/json")
