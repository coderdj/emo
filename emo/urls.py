"""emo URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.8/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Add an import:  from blog import urls as blog_urls
    2. Add a URL to urlpatterns:  url(r'^blog/', include(blog_urls))
"""
from django.conf.urls import include, url
from django.contrib import admin
#from django.contrib.auth.views import login
from django.views.generic.base import TemplateView
from management import views
from django.contrib.auth.decorators import login_required

from tastypie.api import Api
from api.api.resources import StatusResource, SlowControlResource, RunsResource
daqapi = Api(api_name="daq")
daqapi.register(StatusResource())
scapi = Api(api_name="history")
scapi.register(SlowControlResource())
runapi = Api(api_name="runs")
runapi.register(RunsResource())

urlpatterns = [
 
    url(r'^$', TemplateView.as_view( template_name='base.html')),
    url(r'^test', TemplateView.as_view( template_name='base_test.html')),
    url(r'^game', login_required(TemplateView.as_view( template_name='game.html'))),
#    url(r'^pong', login_required(TemplateView.as_view( template_name='pong.html'))),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^pong', include('pong.urls')),                                              
    url(r'^april', TemplateView.as_view(template_name='base_april.html')),
    url(r'^fancy', TemplateView.as_view(template_name='base_fancy.html')),
    url(r'^get_login/', views.get_login, name='get_login'),
    #url(r'^accounts/login',login(template_name="login.html"),name="login"),
#    url(r'^accounts/login/$', 'django.contrib.auth.views.login',
 #       kwargs={'template_name': 'login.html'}, name='login'),
    url(r'^logout', views.logout_page,name='logout'), #must add
    url(r'^profile/$', views.profile, name='profile'),
    url(r'^supermanrequest', views.getStartingUser, name='getstartinguser'),
    url(r'^get_user_doc/', views.get_user_doc, name='get_user_doc'),

    # Documentation
    url(r'^management/', include('management.urls')),
    url(r'^docs/', include('docs.urls')),
    url(r'^runs/', include('runs.urls')),
    url(r'^control/', include('control.urls')),
    url(r'^monitor/', include('monitor.urls')),
    url(r'^log/', include('log.urls')),
    url(r'^config/', include('config.urls')),
    url(r'^access/', include('access_log.urls')),
    url(r'^slow_control/', include('slow_control.urls')),
    url(r'^equipment/', include('equipment.urls')),
    url(r'^accounts/login/$', 'django.contrib.auth.views.login',
        kwargs={'template_name': 'login.html'}, name='login'),
    url(r'^api/', include(daqapi.urls)),
    url(r'^sc_api/', include(scapi.urls)),
    url(r'^runs_api/',include(runapi.urls)),
    url(r'^online_monitor/', include('online_monitor.urls')),
]
