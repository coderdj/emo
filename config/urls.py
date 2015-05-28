from django.conf.urls import include, url
from django.contrib import admin
from django.views.generic.base import TemplateView
from django.contrib.auth.decorators import login_required
from config import views

urlpatterns = [
    url(r'^fetch_run_mode',views.fetch_run_mode,name='fetch_run_mode'),
    url(r'^fetch_mode_list',views.fetch_mode_list,name='fetch_mode_list'),
    url(r'^delete_run_mode',views.delete_run_mode,name='delete_run_mode'),
    url(r'$', views.run_mode_config,name='run_mode_config'),

]
