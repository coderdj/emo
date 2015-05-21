from django.conf.urls import include, url
from django.contrib import admin
from django.views.generic.base import TemplateView
from django.contrib.auth.decorators import login_required
from config import views

urlpatterns = [
    url(r'^fetch_run_mode',views.fetch_run_mode,name='fetch_run_mode'),
    url(r'^fetch_mode_list',views.fetch_mode_list,name='fetch_mode_list'),
    url(r'^submit_run_mode', views.submit_run_mode,name='submit_run_mode'),
    url(r'$', login_required( TemplateView.as_view( template_name=
                                                    "config/index.html"))),
 
]
