from django.shortcuts import render, HttpResponse
from pymongo import MongoClient
import json
from runs.models import run_comment, run_search_form
from django.contrib.auth.decorators import login_required
from django.http import HttpResponsePermanentRedirect
import datetime

@login_required
def runs(request):

    filter_query = {}
    # These options will be set somewhere else later?
    online_db_name = "online"
    runs_db_collection = "runs"
    mongodb_address = "localhost"
    mongodb_port = 27017

    # Connect to pymongo
    client = MongoClient(mongodb_address, mongodb_port)
    db = client[ online_db_name ]
    collection = db[ runs_db_collection ]
    fields = collection.distinct( "mode" )

    if request.method == 'GET':
        filter_form = run_search_form( fields, request.GET )
    else:
        filter_form = run_search_form( fields )

    retset = collection.find( filter_query ).sort( "starttimestamp", -1 )
    return render( request, 'runs/runs.html', { "runs_list": retset, "form" : filter_form } )

@login_required
def rundetail ( request ):

    # These options will have to be set somewhere else later
    online_db_name = "online"
    runs_db_collection = "runs"
    mongodb_address = "localhost"
    mongodb_port = 27017
    client = MongoClient(mongodb_address, mongodb_port)
    db = client[ online_db_name ]
    collection = db[ runs_db_collection ]
    print("HERE")
    
    
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

    # Repackage data for nicer display
    rdata = {
        "name": [ "Run name", str(run) ],
        "starttimestamp": ["Start time", rundoc['starttimestamp'].strftime(
            "%Y-%M-%D %h:%m:%s") ],
        "user": [ "Starting user", rundoc['user'] ],
        "mode": [ "Run mode", rundoc['runmode'] ], }
    if rundoc[ 'endtimestamp' ] is not None:
        rdata[ 'endtimestamp' ] = [ "End time", rundoc[ 'endtimestamp' ].strftime("%Y-%M-%D %h:%m:%s")]
    else:
        rdata[ 'endtimestamp' ] = [ "End time", "None" ]

    # Reader info
    rinfo = rundoc[ 'reader' ]
    readerdata = { "compressed": [ "Compression on", rinfo['compressed'] ],
                   "starttime" : [ "Digitizer start time", rinfo['starttime']],
                   #"endtime"   : [ "Digitizer end time", rinfo['endtime']],
                   "buffer": ["Buffer database and collection",
                              str(rinfo['storage_buffer']['dbaddr'] + ":" +
                                  rinfo['storage_buffer']['dbname'] + "." +
                                  rinfo['storage_buffer']['dbcollection'])]}
    if 'endtime' in rinfo.keys():
        readerdata['endtime'] = ["Digitizer end time", rinfo['endtime']]
    readerini = rinfo['options']

    # Trigger info 
    #tinfo = rundoc['trigger']
    triggerdata = {}
    #triggerdata = {"status": ["Status", tinfo['trigger_status'] ],
    #               "mode"  : ["Mode", tinfo['mode'] ]}
                        
    # Comments
    cdata=[]    
    if "comments" in rundoc.keys():
        for c in rundoc[ 'comments' ]:
            cdata.append([ 0, c['date'].strftime("%Y-%m-%d %H:%M:%S"),
                           c['user'], c['text'] ] )
    rdata['user_comments'] = len(cdata)
    retdict = {'runinfo': rdata, 'comments': cdata, 'readerinfo': readerdata,
               'readerini': readerini, "triggerinfo": triggerdata, }

    return HttpResponse(json.dumps(retdict), content_type = 'application/json')


def download_list ( request ):
    
    ret = {}
    return HttpResponse( json.dumps( ret ), type = 'application/json' )
