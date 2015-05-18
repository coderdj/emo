from django.shortcuts import HttpResponse
from pymongo import MongoClient
from bson.json_util import dumps
from django.contrib.auth.decorators import login_required

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
