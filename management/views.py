from django.contrib.auth import logout
from django.http import HttpResponseRedirect, HttpResponsePermanentRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext
from management.models import UserRequest, UserProfile
import json
import pytz
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
import datetime

def logout_page(request):
    """
    Log users out and re-direct them to the main page.
    """
    logout(request)
    return HttpResponseRedirect('/')

@login_required
def profile(request):
    ''' 
    A user can request permissions using this form
    '''
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

    # If no POST request then check the user's permissions
    retdict = { 'canstartruns': False }
    thisuser = User.objects.get(username=request.user)

    # Find the profile
    if UserProfile.objects.filter(user__id=thisuser.id).count() > 0:
        USERDOC = UserProfile.objects.get(user__id=thisuser.id)
        if (datetime.datetime.now( datetime.timezone.utc ) - USERDOC.control_permission_date).days < 7:
            retdict['canstartruns'] = True
            retdict['expiration'] = USERDOC.control_permission_date + datetime.timedelta(days=7)

    return render_to_response("management/profile.html", retdict, context_instance = RequestContext(request))
