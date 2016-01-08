from django.shortcuts import render
from django.http import HttpResponsePermanentRedirect, HttpResponse
from pymongo import MongoClient
from django.conf import settings
from django.contrib.auth.decorators import login_required
from bson.json_util import dumps
import datetime

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

    mongo_collection = d['slow_control']
    
    newest = mongo_collection.find_one({}, sort= [ ("_id", -1) ])
    newest['key'] = descriptions
    return HttpResponse(dumps(newest), content_type="application/json")

@login_required
def get_sensor_history(request):
    
    max_points = 500
    # include here some GET for filtering sensor/number of points    

    mongo_collection = d['slow_control']
    cursor = mongo_collection.find({}, sort= [ ("_id", -1) ], limit=max_points)

    retdoc = {}
    for doc in cursor:
        for i in range(0, len(doc['sensors'])):
            sensor = doc['sensors'][i]
            if sensor['name'] in retdoc.keys():
                retdoc[sensor['name']].append([(doc['time']-datetime.datetime(1970,1,1))/datetime.timedelta(seconds=1)*1000, sensor['value']])
            else:
                retdoc[sensor['name']] = [[ (doc['time']-datetime.datetime(1970,1,1))/datetime.timedelta(seconds=1)*1000, sensor['value'] ]]
    reversed_doc = {}
    for sensor in retdoc.keys():
        reversed_doc[sensor] = list(reversed(retdoc[sensor]))
    return HttpResponse(dumps(reversed_doc), content_type="application/json")
