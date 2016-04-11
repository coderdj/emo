from django.contrib.auth import logout
from django.shortcuts import render
from bson.json_util import dumps
from django.http import HttpResponseRedirect, HttpResponsePermanentRedirect, HttpResponse
from django.shortcuts import render_to_response
from django.template import RequestContext
from management.models import UserRequest, UserProfile, UserInfo, ShiftDefinition, ShiftSignUp
import json
import pytz
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
import datetime
from django.conf import settings
from pymongo import MongoClient
import pymongo
import operator
import math
import dateutil
import logging
from django.contrib.auth import authenticate, login

# Get an instance of a logger                                                                                     
logger = logging.getLogger('emo')

client = MongoClient(settings.ONLINE_DB_ADDR)
db = client[ settings.ONLINE_DB_NAME ]

dayno = {"Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
          "Friday": 4, "Saturday": 5, "Sunday": 6}

@csrf_exempt
def get_login(request):
    user = authenticate(username=request.POST['username'],  password=request.POST['password'])
    login(request, user)
    return HttpResponse("Logged In")

@login_required
def GetHs(request):
    users = db['users'].find({"g_id": {"$exists": True}}).sort("g_id",pymongo.DESCENDING).limit(5)
    ret=[]
    for usr in users:
        #if usr['username'] != 'tunnell':
        ret.append({"name": usr['username'], "g_id": usr['g_id']})
        ##else:
        #ret.append({"name": usr['username'], "g_id": 0})
    return HttpResponse(json.dumps({"list": ret}), content_type="application/json")

@login_required
def SetHs(request):
    if request.method!="GET" or 'g_id' not in request.GET:
        return HttpResponse(json.dumps({"good": False}), content_type="application/json")
    doc = db['users'].find({"username": request.user.username})
    try:
        if int(request.GET['g_id']) > int(doc[0]['g_id']): 
            db['users'].update({"username": request.user.username}, 
                               {"$set":{"g_id": int(request.GET['g_id'])}}, 
                               upsert=False)
    except:
        db['users'].update({"username": request.user.username},
                           {"$set":{"g_id": int(request.GET['g_id'])}},
                           upsert=False)    

    return HttpResponse(json.dumps({"good": True, "g_id": request.GET['g_id']}), content_type="application/json")

def GetShiftResponsibility(cdef, start, shifts_per_week):
    # Assuming we start handing out shifts at "start", how many shifts does 
    # Each institute have to do? Assume we count membership at institutes
    # on 1.1. of each year.
    
    users = db['users'].find({ 'start_date':
                               {"$lt":datetime.datetime(year=cdef.year,
                                                        month=cdef.month, 
                                                        day=cdef.day)}})
    inst_count = {}
    total = 0
    total_all = users.count()
    for user in users:
        
        # Don't count people who left
        if 'end_date' in user and user['end_date']<cdef:
            continue
        
        if user['institute'] not in inst_count.keys():
            inst_count[user['institute']]=0
        if ( user['position'] == "PI" or 
             user['position'] =="Postdoc" or 
             user['position'] == "Staff" or
             user['position'] == "PhD student" ):
            inst_count[user['institute']] +=1
            total += 1
    
    inst_frac = {}
    total_shifts = (52-start.isocalendar()[1])*shifts_per_week
    for institute in inst_count.keys():
        inst_frac[institute] = {
            "whole": math.floor((inst_count[institute]/total)*total_shifts),
            "frac": ((total_shifts*(inst_count[institute])/total)) - 
            float(math.floor(total_shifts*(inst_count[institute]/total))),
        }
        
    # Assign shifts
    assigned = 0
    assigned_shift={}
    for institute in inst_frac:
        assigned += inst_frac[institute]['whole']
        assigned_shift[institute]={'shifts': inst_frac[institute]['whole'],
                                   "people": inst_count[institute],
                                   "frac": inst_frac[institute]['whole']+
                                   inst_frac[institute]['frac']}

    # Might not come to whole number
    sorted_inst = sorted(inst_frac.keys(), key=operator.itemgetter(1))
    i=0
    while assigned < total_shifts and i < len(sorted_inst):
        assigned_shift[sorted_inst[i]]['shifts'] +=1
        assigned+=1
        i+=1
    ret_assigned=[]
    #for x in sorted_inst:
    #    ret_assigned.append({"institute": x, "shifts": assigned_shift[x]})
    retdoc = {"shifts": assigned_shift,
              "frac": inst_frac,
              "start": datetime.datetime.combine(start,
                                                 datetime.datetime.min.time()),
              "total": total_shifts,
              "user_count": total_all,
              "institutes": inst_count}              
    return retdoc

@login_required
def GetShifts(request):
    # This is a fullcalendar function
    # Must take arguments with start and end as ISO dates
    # with format "2014-12-01"

    if request.method != 'GET':
        return HttpResponse({}, content_type="application/json")

    if 'start' not in request.GET or 'end' not in request.GET:
        return HttpResponse({}, content_type="application/json")

    start_time = dateutil.parser.parse(request.GET['start'])
    end_time = dateutil.parser.parse(request.GET['end'])
    docs =[]
    try:
        docs = db['shifts'].find({
            "start": {"$gt": start_time,
                      "$lt": end_time  },
        })
    except:
        return HttpResponse({}, content_type="application/json")

    retdoc=[]
    for doc in docs:
        retdoc.append({
            "start": doc['start'].strftime("%Y-%m-%dT%H:%M:%S"),
            "end": doc['end'].strftime("%Y-%m-%dT%H:%M:%S"),
            "title": doc['type'] + ": " + doc['shifter'] + " (" + doc['institute'] + ")",
            "type": doc['type'],
            "available": doc['available'],
            "institute": doc['institute'],
            "shifter": doc['shifter']
        })
    return HttpResponse(dumps(retdoc), content_type="application/json")


@login_required
def GetShiftStats(request):
    
    # SHIFT DOC
    # institute
    # start
    # end
    # user
    # type : shift, responsible, training
    ret_doc = {}
    if request.method == "GET" and "year" in request.GET:
        # Make sure it works on January first too
        year = request.GET['year']
        jan_first = datetime.datetime(year=int(year), month=1, day=1)
        next_jan = datetime.datetime(year=int(year)+1, month=1, day=1)
        
        rules = db['shift_rules'].find_one({"year": year})
        if rules is not None:
            
            cursor = db['shifts'].find({"start": {"$gte": jan_first, 
                                                  "$lt": next_jan},
                                        "type": { "$in": ["shifter", "responsible"] }})
            done_doc = {}
            for doc in cursor:
                if doc['institute'] not in done_doc:
                    done_doc[doc['institute']] = 0
                done_doc[doc['institute']] += int((doc['end']-doc['start']).days/7)
            #need_doc = GetShiftResponsibility(rules)
            need_doc = rules['shifts']
            for institute in need_doc['shifts']:
                if institute in done_doc:
                    need_doc['shifts'][institute]['done'] = done_doc[institute]
                else:
                    need_doc['shifts'][institute]['done'] = 0
            ret_doc = {"institutes": need_doc}
    return HttpResponse(dumps(ret_doc), 
                        content_type = 'application/json')


def last_weekday(d, weekday):
    days_behind = d.weekday() - weekday
    return d - datetime.timedelta(days_ahead)

def next_weekday(d, weekday):
    days_ahead = weekday - d.weekday()
    if days_ahead < 0: # Target day already happened this week
        days_ahead += 7
    return d + datetime.timedelta(days_ahead)

def CreateShiftTemplate(doc):
    # Creates documents in the shifts db corresponding to unassigned shifts
    year = doc['year']
    next_jan = datetime.datetime(year=int(year)+1, month=1, day=1)
    end_date = next_weekday(next_jan, dayno[doc['shift_reset']]) - datetime.timedelta(days=1)
    start_date = next_weekday(doc['start_date'], dayno[doc['shift_reset']])
    shifts_per_week = doc['shifts_per_week']

    db['shifts'].remove({"year": year})

    while start_date < end_date:
        for i in range(0, shifts_per_week):
            shift_type="shifter"
            if i==0:
                shift_type="responsible"
            
            doc = {
                "year": year,
                "start": start_date,
                "end": start_date + datetime.timedelta(days=7),
                "available": True,
                "type": shift_type,
                "institute": "none",
                "shifter": "none"
            }
            #logger.error(doc)
            db['shifts'].insert(doc)
            
        start_date = start_date + datetime.timedelta(days=7)

@login_required
def shift_rules(request):
    # Defines a shift rules doc
    # Also initializes a bunch of empty events for the shifts

    shift_def = ShiftDefinition()
    shift_resp = {}
    year = datetime.datetime.now().year
    if request.method=="GET" and "year" in request.GET:
        year = request.GET['year']
    shift_doc = db['shift_rules'].find({"year": str(year)}).limit(1)
    #shift_doc = db['shift_rules'].find()
    if shift_doc.count() != 0:        
        shift_resp = shift_doc[0]['shifts']#GetShiftResponsibility(shift_doc[0]['collab_def_date'],
    #shift_doc[0]['start_date'])

    if request.method=="POST": 
        new_shift_def = ShiftDefinition(request.POST)
        if new_shift_def.is_valid():
            
            doc = {
                'start_date': datetime.datetime.combine(
                    new_shift_def.cleaned_data['start_date'],
                    datetime.datetime.min.time()),
                'auto_assign_weeks': new_shift_def.cleaned_data['auto_assign_weeks'],
                'collab_def_date': datetime.datetime.combine(
                    new_shift_def.cleaned_data['collab_def_data'],
                    datetime.datetime.min.time()),
                'shift_reset': new_shift_def.cleaned_data['shift_reset'],
                'auto_assign_start': datetime.datetime.combine(
                    new_shift_def.cleaned_data['auto_assign_start'],
                    datetime.datetime.min.time()),
                'user': request.user.username,
                'created': datetime.datetime.now(),
                "year": new_shift_def.cleaned_data['year'],
                'shifts_per_week': new_shift_def.cleaned_data['shifts_per_week'],
                'shifts': GetShiftResponsibility(
                    new_shift_def.cleaned_data['collab_def_data'], 
                    new_shift_def.cleaned_data['start_date'],
                    new_shift_def.cleaned_data['shifts_per_week'])
            }
            try:
                db['shift_rules'].update({"year": doc['year']}, 
                                         {"$set": doc}, upsert=True)
                shift_resp=doc['shifts']                
            except Exception as e:
                logger.error("Insert failed")
                logger.error(e)
                shift_resp={"ERR":e}
            CreateShiftTemplate(doc)
            # create new def
            shift_def = new_shift_def
        else:
            shift_resp={"ERR": "NOT_VALID"}
            
    retdict = {"form": shift_def, "resp": shift_resp}
    #retdict={}
    return render(request, "management/shift_rules.html", retdict)

@login_required
def shift_calendar(request):
    # The calendar view needs some information about the current user
    # Here's the logic. If the user is a PI, let him assign any of
    # his slaves to a shift.
    # Otherwise he can only assign himself
    retdict = {}
    our_user = db['users'].find_one({"username": request.user.username})
    if our_user is None:
        return render(request, "management/shift_calendar.html", retdict)

    if our_user['position'] == "PI":
        user_cursor = (db['users'].find({"institute": our_user['institute'],
                                         "username": {"$exists": True},
                                         "last_name": {"$exists": True},
                                         "first_name": {"$exists": True},
                                         }))
        user_list = {}
        for iuser in user_cursor:
            if iuser['institute'] not in user_list:
                user_list[iuser['institute']] = []
            
            user_list[iuser['institute']].append({
                "username": iuser['username'],
                "last_name": iuser['last_name'],
                "first_name": iuser['first_name']
            })
    else:
        user_list = { our_user['institute']: [{
            "username": our_user['username'],
            "last_name": our_user['last_name'],
            "first_name": our_user['first_name']
        }]}
    signup_form = ShiftSignUp()
    if request.method == "POST":
        logger.error("post request")
        logger.error(request.POST)
        signup_form = ShiftSignUp(request.POST)
        if signup_form.is_valid():
            logger.error(signup_form)
            # Update doc
            start = datetime.datetime.combine(signup_form.cleaned_data['start_date'],
                                              datetime.datetime.min.time())
            end = datetime.datetime.combine(signup_form.cleaned_data['end_date'],
                                            datetime.datetime.min.time())
            query = {
                "start": start,
                "type": signup_form.cleaned_data["shift_type"]
            }            
            if signup_form.cleaned_data['shift_type'] != "training":
                if "remove" in signup_form.cleaned_data and signup_form.cleaned_data['remove']==True:                    
                    db['shifts'].update(query,
                                        {"$set": { "available": True,
                                                   "institute": "none",
                                                   "shifter": "none"
                                               }}, upsert=False)
                    
                else:
                    db['shifts'].update(query, 
                                        {"$set": 
                                         { "available": False,
                                           "institute": 
                                           signup_form.cleaned_data['institute'],
                                           "shifter": 
                                           signup_form.cleaned_data['user']
                                       }}, upsert=False)
            else:
                if "remove" in signup_form.cleaned_data and signup_form.cleaned_data['remove'] == True:
                    db['shifts'].remove(query)
                else:
                    doc = {
                        "year": signup_form.cleaned_data['start_date'].year,
                        "start": start,
                        "end": end,
                        "available": False,
                        "type": signup_form.cleaned_data['shift_type'],
                        "institute": signup_form.cleaned_data['institute'],
                        "shifter": signup_form.cleaned_data['user']
                    }
                    logger.error(doc)
                    db['shifts'].insert(doc)
    if signup_form.is_valid() and "remove" in signup_form.cleaned_data:
        signup_form.cleaned_data['remove']=False
    retdict={"signup_form": signup_form, 
             "user_list": user_list}
    return render(request, "management/shift_calendar.html", retdict)

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
