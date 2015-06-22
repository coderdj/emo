from django.http import HttpResponsePermanentRedirect, HttpResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
import datetime
import pytz
import json
from pymongo import MongoClient
from bson.objectid import ObjectId
from log.models import LogEntryForm, LogSearchForm, LogCommentForm
from bson.json_util import dumps
from django.conf import settings


@login_required
def get_dispatcher_log(request):

    """
    Make the dispatcher log page
    """
    c = MongoClient(settings.LOG_DB_ADDR, settings.LOG_DB_PORT)
    d = c[settings.LOG_DB_NAME]
    mongo_collection = d['log']

    mongo_query = {"sender": "default_sender"}
    log_list = mongo_collection.find(mongo_query).sort("_id", -1)[:50]

    return HttpResponse(dumps(log_list), content_type="application/json")


@login_required
def log(request):

    """
    Make the main log page
    """
    c = MongoClient(settings.LOG_DB_ADDR, settings.LOG_DB_PORT)
    d = c[settings.LOG_DB_NAME]
    mongo_collection = d['log']

    mongo_query = {}

    # Set a default value for max entries
    max_entries = 100

    if request.method == "GET":

        search_form = LogSearchForm(request.GET)

        if search_form.is_valid():

            # Strip the data
            if search_form.cleaned_data['custom'] != "":
                mongo_query = json.loads(search_form.cleaned_data['custom'])
            if search_form.cleaned_data['detector'] != "":
                mongo_query['detector'] = search_form.cleaned_data['detector']
            if search_form.cleaned_data['run_name'] != "":
                mongo_query['run'] = search_form.cleaned_data['run_name']
            if search_form.cleaned_data['priority'] != "" and search_form.cleaned_data['priority'] != '-1':
                mongo_query['priority'] = int(search_form.cleaned_data['priority'])
            if search_form.cleaned_data['start_date'] is not None:
                mongo_query['date'] = {"$gt": datetime.datetime.combine(
                    search_form.cleaned_data['start_date'],
                    datetime.datetime.min.time())}
            if search_form.cleaned_data['end_date'] is not None:
                if 'date' in mongo_query.keys():
                    mongo_query['date']['$lt'] = datetime.datetime.combine(search_form.cleaned_data['end_date'],
                                                                           datetime.datetime.max.time())
                else:
                    mongo_query['time'] = {"$lt": datetime.datetime.combine(search_form.cleaned_data['end_date'],
                                                                            datetime.datetime.max.time())}
            if search_form.cleaned_data['max_entries'] is not None:
                max_entries = search_form.cleaned_data['max_entries']
    else:
        search_form = LogSearchForm()

    print(mongo_query)
    log_list = mongo_collection.find(mongo_query).sort("_id", -1)[:max_entries]

    return render(request, 'log/log.html', {"log_list": log_list, "form": search_form})


@login_required
def new_comment(request):

    """
    Add a new comment to a log entry.
    """
    c = MongoClient(settings.LOG_DB_ADDR, settings.LOG_DB_PORT)
    d = c[settings.LOG_DB_NAME]
    mongo_collection = d['log']

    if request.method == 'POST':

        comment = LogCommentForm(request.POST)
        if comment.is_valid():

            # Pull data from the form
            redirect_url = comment.cleaned_data['redirect_url']
            doc_id = comment.cleaned_data['log_id']
            text = comment.cleaned_data['content']
            user = request.user.username

            # If the entry exists append the comment to it
            comment_dict = {
                "text": text,
                "date":    pytz.utc.localize(datetime.datetime.now()),
                "user":  user,
                "priority": 0
                }

            mongo_collection.update({"_id": ObjectId(doc_id)}, {"$push": {"comments": comment_dict}})

            return HttpResponsePermanentRedirect(redirect_url)
    return HttpResponsePermanentRedirect('/log/')


@login_required(login_url="/login/")
def new_log_entry(request):

    c = MongoClient(settings.LOG_DB_ADDR, settings.LOG_DB_PORT)
    d = c[settings.LOG_DB_NAME]
    mongo_collection = d['log']

    if request.method == 'POST':

        # Pull data from POST request form
        new_form = LogEntryForm(request.POST)

        if new_form.is_valid():
            new_entry = {
                "message": new_form.cleaned_data['message'],
                "priority": 0,
                "sender": request.user.username,
                "time": pytz.utc.localize(datetime.datetime.now()),
                "run": new_form.cleaned_data['run_name'],
                "detector": new_form.cleaned_data['detector'],
            }

            mongo_collection.insert(new_entry)

        return HttpResponsePermanentRedirect('/log/')
    else:
        new_form = LogEntryForm()

    return HttpResponsePermanentRedirect('/log')
    #return render(request, 'log/newlogentry.html', {'form': new_form})
