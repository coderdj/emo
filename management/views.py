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
import logging

# Get an instance of a logger                                                                                     
logger = logging.getLogger('emo')

client = MongoClient(settings.ONLINE_DB_ADDR)
db = client[ settings.ONLINE_DB_NAME ]

@login_required
def shift_management(request):
    return HttpResponsePermanentRedirect("/management")

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
                db['users'].update({"name": request.user.username}, 
                                   {"$set": doc}, upsert=True)
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
