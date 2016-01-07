from django.shortcuts import HttpResponse, HttpResponsePermanentRedirect
from pymongo import MongoClient
from bson.json_util import dumps, loads
from django.contrib.auth.decorators import login_required
from config.models import ModeSubmissionForm
from django.shortcuts import render
import datetime
from django.conf import settings
import logging

# Get an instance of a logger    
logger = logging.getLogger('emo')
mode_db_collection = "run_modes"

# Connect to pymongo
#client = MongoClient(settings.ONLINE_DB_ADDR, settings.ONLINE_DB_PORT)
client = MongoClient(settings.ONLINE_DB_ADDR)
db = client[settings.ONLINE_DB_NAME]

collection = db[mode_db_collection]

@login_required
def delete_run_mode(request):

    """
    Deletes a run mode by name
    :param request:
    :return:
    """

    if 'mode' not in request.GET.keys():
        return
    if request.GET['mode'] is not None:
        collection.remove({"name":request.GET['mode']})
    return HttpResponsePermanentRedirect("config/index.html")

@login_required
def fetch_run_mode(request):

    """
    Fetches run mode by name
    :param request:
    :return: HTTp response containing the mode as a JSON dict
    """

    if request.GET['name'] is not None:
        mode = collection.find_one({"name": request.GET['name']})
        if mode is not None:
            del mode["_id"]
            return HttpResponse(dumps(mode), content_type='application/json')
    return


@login_required
def fetch_mode_list(request):

    """
    Fetches names of unique run modes from the DB
    :param request:
    :return: HTTp response containing the list as a JSON dict
    """

    detectors = collection.distinct("detector")
    ret = {}
    
    for det in detectors:
        modes = collection.find({"detector": det})
        ret[det] = modes.distinct("name")
    print("MADE HERE")
    print(detectors)
    print(ret)
    if len(ret) > 0:
        return HttpResponse(dumps(ret), content_type='application/json')


@login_required
def run_mode_config(request):

    """
    Parse and insert a run mode config or serve the default
    :param request: a form object containing the run mode as text, sent via POST
    :return: error in case object is not valid json (and form back!)
    """

    if request.method == "POST":
        
        theform = ModeSubmissionForm(request.POST)

        if theform.is_valid():

            # Pull data from the form
            print("valid")
            thebson= {}
            try:
                thebson = loads(theform.cleaned_data['bulk'])
            except:
                logger.error("Couldn't load BSON")
                logger.error(theform.cleaned_data)

            if thebson != {}:
                thebson['user'] = request.user.username
                thebson['date'] = datetime.datetime.now(datetime.timezone.utc)
                if '_id' in thebson.keys():
                    del thebson['_id']
                print(thebson)
                try:
                    collection.update({"name": thebson['name']}, {"$set": thebson}, upsert=True)
                except Exception as e:
                    logger.error("Insert failed")
                    logger.error(e)
                    print("Insert failed")
                    print((e))

    else:
        theform = ModeSubmissionForm()

    # Get modes list
    detectors = collection.distinct("detector")
    ret = []
    for det in detectors:
        modes = collection.find({"detector": det})

        for mode in modes:
            dic = {}
            if 'name' not in mode.keys() or 'date' not in mode.keys() or 'user' not in mode.keys():
                continue
            dic['name']= mode['name']
            dic['date']= mode['date']
            dic['user']=mode['user']
            if 'comment' in mode.keys():
                dic['comment']=mode['comment']
            else:
                dic['comment'] = "none"
            ret.append(dic)

    return render(request, 'config/index.html', {'form': theform, 'runmodes':ret })
