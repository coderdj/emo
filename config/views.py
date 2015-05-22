from django.shortcuts import HttpResponse
from pymongo import MongoClient
from bson.json_util import dumps, loads
from django.contrib.auth.decorators import login_required
from config.models import ModeSubmissionForm
from django.shortcuts import render
import datetime

# These options will be set somewhere else later?
online_db_name = "online"
runs_db_collection = "run_modes"
mongodb_address = "localhost"
mongodb_port = 27017

# Connect to pymongo
client = MongoClient(mongodb_address, mongodb_port)
db = client[online_db_name]
collection = db[runs_db_collection]

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
    # Connect to pymongo
    client = MongoClient(mongodb_address, mongodb_port)
    db = client[online_db_name]
    collection = db[runs_db_collection]

    if request.method == "POST":
        print("HI")
        theform = ModeSubmissionForm(request.POST)

        if theform.is_valid():

            # Pull data from the form
            print("valid")
            thebson= {}
            try:
                thebson = loads(theform.cleaned_data['bulk'])
            except:
                print("Couldn't load BSON")
                print(theform.cleaned_data)

            if thebson != {}:
                thebson['user'] = request.user.username
                thebson['date'] = datetime.datetime.now(datetime.timezone.utc)
                if '_id' in thebson.keys():
                    del thebson['_id']
                print(thebson)
                try:
                    collection.insert(thebson)
                except Exception as e:
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
