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
from django.conf import settings
from django.conf import settings
import logging

# Get an instance of a logger                                                       
logger = logging.getLogger('emo')

@login_required
def get_run(request):
    client = MongoClient(settings.RUNS_DB_ADDR)
    if (request.method == "GET" and "detector" in request.GET and
        "name" in request.GET):
        db = client[settings.RUNS_DB_NAME]
        coll = db[settings.RUNS_DB_COLLECTION]
        search = {"detector": request.GET['detector'], "name": request.GET['name']}
        doc = coll.find_one(search)
        
        if doc is not None:
            return HttpResponse(dumps(doc), content_type="application/json")
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
    last_runs_mv = collection.find({"detectors":"muon_veto"}).sort("start", -1).limit(1)
    
    retdoc = {"tpc":{}, "muon_veto":{}}
    if last_runs_tpc.count()!=0:
        last_run_tpc = last_runs_tpc[0]
        retdoc["tpc"] = { "name": last_run_tpc['name'],
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
def runs(request):

    filter_query = {"detector": "tpc"}

    # Connect to pymongo
    client = MongoClient(settings.RUNS_DB_ADDR)
    db = client[ settings.RUNS_DB_NAME ]

    collection = db[ settings.RUNS_DB_COLLECTION ]
    fields = collection.distinct( "source.type" )
    fields.insert( 0, "All" )
    fieldslist = zip (fields, fields)
    

    if request.method == 'GET':
        filter_form = run_search_form( fieldslist, request.GET )

        if filter_form.is_valid():
            #build query from form
            if filter_form.cleaned_data[ 'custom' ] is not "":
                logger.error(filter_form.cleaned_data['custom'])
                filter_query = loads( filter_form.cleaned_data['custom'] )
            if "detector" in filter_form.cleaned_data and filter_form.cleaned_data['detector'] !="":
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
    
    retset = collection.find( filter_query ).sort( "start", -1 )
    return render( request, 'runs/runs.html', {"runs_list": dumps(retset), 
                                               "form" : filter_form,
                                               "query": filter_query} )

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

@login_required
def new_comment(request):

    """                                                                         
    Add a new comment to a run entry.
    """
    c = MongoClient(settings.RUNS_DB_ADDR)
    d = c[settings.RUNS_DB_NAME]

    mongo_collection = d[settings.RUNS_DB_COLLECTION]

    if request.method == 'POST':
        logger.error(request.POST)
        comment = RunCommentForm(request.POST)
        logger.error(comment)
        if comment.is_valid():
            logger.error("valid")
            # Get data                                                          
            doc_id = comment.cleaned_data['run_id']
            user = request.user.username
            date = pytz.utc.localize(datetime.datetime.now())
            
            # Now do the update to a comment if there is one                    
            if 'content' in comment.cleaned_data:
                text = comment.cleaned_data['content']
                user = request.user.username
                logger.error(text)
                # If the entry exists append the comment to it                  
                comment_dict = {
                    "text": text,
                    "date": date,
                    "user":  user,
                    }

                mongo_collection.update({"_id": ObjectId(doc_id)}, {"$push": 
                                                                    {"comments": 
                                                                     comment_dict}})
                return HttpResponse(dumps(comment_dict), content_type='application/json')
    return HttpResponsePermanentRedirect('/runs/')
