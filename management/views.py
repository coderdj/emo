from django.contrib.auth import logout
from django.shortcuts import render
from bson.json_util import dumps
from django.http import HttpResponseRedirect, HttpResponsePermanentRedirect, HttpResponse
from django.shortcuts import render_to_response
from django.template import RequestContext
from management.models import UserRequest, UserProfile, UserInfo, ShiftDefinition
import json
import pytz
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
import datetime
from django.conf import settings
from pymongo import MongoClient
import operator
import logging

# Get an instance of a logger                                                                                     
logger = logging.getLogger('emo')

client = MongoClient(settings.ONLINE_DB_ADDR)
db = client[ settings.ONLINE_DB_NAME ]

dayno = {"Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
          "Friday": 4, "Saturday": 5, "Sunday": 6}

def GetShiftResponsibility(start):
    # Assuming we start handing out shifts at "start", how many shifts does 
    # Each institute have to do? Assume we count membership at institutes
    # on 1.1. of each year.

    year = start.year
    users = db['users'].find({ 'start_date':{"$gt":datetime.datetime(year=year,
                                                                     month=1, 
                                                                     day=1)}})
    inst_count = {}
    total = 0
    for user in users:
        if user['institute'] not in isnt_count.keys():
            inst_count[user['institute']]=0
        if ( user['position'] == "PI" or 
             user['position'] =="Postdoc" or 
             user['position'] == "PhD student" ):
            inst_count[user['institute']] +=1
            total += 1
    
    inst_frac = {}
    total_shifts = (52-start.isocalendar()[1])*2
    for institute in inst_count.keys():
        inst_frac[institute] = {
            "whole": int(inst_count[institute]/total),
            "frac": (inst_count[institute]%total)/total,
        }
        
    # Assign shifts
    assigned = 0
    assigned_shift={}
    for institute in inst_frac:
        assigned += inst_frac[institute]['whole']
        assigned_shift[institute] = whole

    # Might not come to whole number
    sorted_inst = sorted(x.keys(), key=operator.itemgetter(1))
    i=0
    while assigned < total_shifts and i < len(sorted_inst):
        assigned_shift[sorted_inst[i]] +=1
        assigned+=1
    
    retdoc = {"shifts": assigned_shift,
              "start": start,
              "total": total_shifts }              
    return retdoc

def GetShiftStats(year):
    
    # SHIFT DOC
    # institute
    # start
    # end
    # user
    # type : shift, responsible, training

    # Make sure it works on January first too
    jan_first = datetime.datetime(year=year, month=1, day=1)
    next_jan = datetime.datetime(year=year+1, month=1, day=1)
        
    cursor = db['shifts'].find({"start": {"$gte": jan_first, 
                                          "$lt": next_jan},
                                "type": { "$in": ["shift", "responsible"] }})
    ret_doc = {}
    for doc in cursor:
        if doc['institute'] not in ret_doc.keys():
            ret_doc[doc['institute']] = 0
        ret_doc[doc['institute']] += int((doc['end']-doc['start']).days/7)
    return ret_doc

def last_weekday(d, weekday):
    days_behind = d.weekday() - weekday
    return d - datetime.timedelta(days_ahead)

def UpdateShiftPlan():
    # Note: we allow the system to update shifts up to
    # auto_assign_weeks in advance even if that rolls over into
    # next year
    shift_doc = db['shifts'].find_one({"type": "rules"})
    if shift_doc is None:
        return

    worry_end = (datetime.datetime.now() + 
                 datetime.timedelta(days=7*shift_doc['auto_assign_weeks']))
    
    # Not starting, can quit
    if worry_end < doc['start_date']:
        return
    first_date = (doc['start_date'] - 
                  datetime.timedelta(days=last_weekday(doc['start_date'], 
                                                       dayno[doc['shift_reset']])))
    
    shift_resp = GetShiftResponsibility(doc['start_date'])
    return

@login_required
def generate_shifts(request):

    shift_def = ShiftDefinition()
    if request.method == "POST":
        shift_def = ShiftDefinition(request.POST)
        if shift_def.is_valid():
            
            # Get values from form
            doc = {
                'start_date': datetime.datetime.combine(
                    shift_def.cleaned_data['start_date'],
                    datetime.datetime.min.time),
                'auto_assign_weeks': shift_def.cleaned_data['auto_assign_weeks'],
                'shift_reset': shift_def.cleand_data['shift_reset'],
                'auto_assign_start': datetime.datetime.combine(
                    shift_def.cleaned_data['auto_assign_start'],
                    datetime.datetime.min.time),
                'user': request.user.username,
                'created': datetime.datetime.now(),                
            }
            
            try:
                db['shifts'].update({"type": "rules"}, {"$set": doc}, upsert=True)
            except Exception as e:
                logger.error("Insert failed")
                logger.error(e)
            
            UpdateShiftPlan()
    return HttpResponse({"form": shift_def}, content_type="application/json")

@login_required
def shift_management(request):
    retdict = {}
    return render_to_response("management/shift_responsibility.html", retdict, 
                              content_type="application/json")


@login_required
def get_user_list(request):
    user_list = (db['users'].find())
    retlist = []
    for doc in user_list:
        newdoc=doc
        if 'username' not in doc.keys():
            newdoc['username'] = "unknown"            
        retlist.append((newdoc))
    user_form = UserInfo()
    retlist = dumps(retlist)
    return render(request, 'management/user_management.html', {"users": retlist, "form": user_form})


@login_required
def update_user(request):
    
    if request.method == "POST":
        profile_update = UserInfo(request.POST)
            
        if profile_update.is_valid():            
            doc = {
                "username": profile_update.cleaned_data['username'],
                "last_name": profile_update.cleaned_data['last_name'],
                "first_name": profile_update.cleaned_data['first_name'],
                "institute": profile_update.cleaned_data['institute'],
                "position": profile_update.cleaned_data['position'],
                "email": profile_update.cleaned_data['email']
            }
            if "training" in request.POST:
                if request.POST['training'] == 'on':
                    doc['training']=True
            else:
                doc['training'] = False
            if "responsible" in request.POST:
                if request.POST['responsible'] == 'on':
                    doc['responsible']=True
            else:
                doc['responsible'] = False

            extra_fields = ['skype_id', 'github_id', 'cell', 'nickname']
            for extra in extra_fields:
                if extra in profile_update.cleaned_data.keys():
                    doc[extra] = profile_update.cleaned_data[extra]
            try:
                db['users'].update({"last_name": doc['last_name'],
                                    'first_name': doc['first_name']},
                                   {"$set": doc}, upsert=True)
            except Exception as e:
                logger.error("Insert failed")
                logger.error(e)
    return HttpResponsePermanentRedirect("/management", content_type="application/json")

@login_required
def get_user_doc(request):

    uname = request.user.username
    if request.method == 'GET' and 'user_name' in request.GET:
        uname = request.GET['user_name']
    # Look up user in mongodb
    user_doc = db['users'].find_one({"username": uname})
    ret_mdb={"none": "none"}
    if user_doc is not None:
        ret_mdb=user_doc
    retdict = {'user': ret_mdb}
    return HttpResponse(dumps(retdict), content_type="application/json")

def logout_page(request):
    """
    Log users out and re-direct them to the main page.
    """
    logout(request)
    return HttpResponseRedirect('/')

@login_required
def getStartingUser(request):
    
    superman = "nobody"
    for userobj in UserProfile.objects.all():
        if (datetime.datetime.now( datetime.timezone.utc ) - userobj.control_permission_date).days < 7:
            superman=userobj.user.username
    return HttpResponse(json.dumps({"starting_user": superman}), content_type = 'application/json')

@login_required
def profile(request):
    ''' 
    A user can request permissions using this form
    '''
    profile_update = UserInfo()
    if request.method == 'POST':
        user_request = UserRequest(request.POST)
        if user_request.is_valid():            

            # Get the user object
            thisuser = User.objects.get(username=request.user)

            # If there are any other controllers then remove their permission
            for userobj in UserProfile.objects.all():
                if (datetime.datetime.now( datetime.timezone.utc ) - userobj.control_permission_date).days < 7:
                    userobj.control_permission_date = datetime.datetime(1985, 8, 8, 10, 23)
                    userobj.save()

            # If there is no profile make one
            if UserProfile.objects.filter(user__id=thisuser.id).count() == 0:
                USERDOC = UserProfile()
                USERDOC.user = thisuser                
            else:
                USERDOC = UserProfile.objects.get(user__id=thisuser.id)        
            
            # Set permissions
            if USERDOC is not None:
                if user_request.cleaned_data['auth'] == 'auth':
                    USERDOC.control_permission_date = datetime.datetime.now( datetime.timezone.utc ) #pytz.utc.localize(datetime.datetime.now())
                else:
                    USERDOC.control_permission_date = datetime.datetime(1985, 8, 8, 10, 23)
                USERDOC.save()

            return HttpResponsePermanentRedirect('/profile')
                
        # Now see if we rather posted something that looks like a profile update
        # Probably massively overusing this view function
        profile_update = UserInfo(request.POST)
        if profile_update.is_valid():
            doc = {
                "username": profile_update.cleaned_data['username'],
                "last_name": profile_update.cleaned_data['last_name'],
                "first_name": profile_update.cleaned_data['first_name'],
                "institute": profile_update.cleaned_data['institute'],
                "position": profile_update.cleaned_data['position'],
                "email": profile_update.cleaned_data['email']
            }
            extra_fields = ['skype_id', 'github_id', 'cell', 'nickname']
            for extra in extra_fields:
                if extra in profile_update.cleaned_data.keys():
                    doc[extra] = profile_update.cleaned_data[extra]
            try:
                db['users'].update({"username": doc['username']},
                                   {"$set": doc}, upsert=True)

                #db['users'].update({"last_name": doc['last_name'],
                #                    "first_name": doc['first_name'],
                #                    "institute": doc['institute']}, 
                #                   {"$set": doc}, upsert=True)
            except Exception as e:
                logger.error("Insert failed")
                logger.error(e)

    # If no POST request then check the user's permissions and info
    retdict = { 'canstartruns': False }
    thisuser = User.objects.get(username=request.user)

    # Find the profile
    if UserProfile.objects.filter(user__id=thisuser.id).count() > 0:
        USERDOC = UserProfile.objects.get(user__id=thisuser.id)
        if (datetime.datetime.now( datetime.timezone.utc ) - USERDOC.control_permission_date).days < 7:
            retdict['canstartruns'] = True
            retdict['expiration'] = USERDOC.control_permission_date + datetime.timedelta(days=7)

    # Look up user in mongodb
    user_doc = db['users'].find_one({"username": request.user.username})
    ret_mdb={"none": "none"}
    if user_doc is not None:
        ret_mdb=user_doc
    retdict['mdb'] = ret_mdb
    retdict['form'] = profile_update
    return render_to_response("management/profile.html", retdict, context_instance = RequestContext(request))
