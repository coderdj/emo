from django.conf.urls import include, url
from django.contrib import admin
from django.views.generic.base import TemplateView
from django.contrib.auth.decorators import login_required
from runs import views
urlpatterns = [

    #url(r'^rundetail',views.rundetail,name='rundetail'),
    url(r'^newcomment', views.new_comment, name='newcomment'),
    url(r'^download_list',views.download_list,name='download_list'),
    url(r'^last_run_per_det', views.last_run_per_det, name="last_run_per_det"),
    url(r'^runs_started', views.runs_started, name="runs_started"),
    url(r'^get_run', views.get_run, name="get_run"),
    url(r'$', login_required( views.runs ), name='runs' ),
]

