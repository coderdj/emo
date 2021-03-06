from django.conf.urls import include, url
from django.contrib import admin
from django.views.generic.base import TemplateView
from django.contrib.auth.decorators import login_required
from equipment import views

urlpatterns = [
    url(r'^new_equipment',views.new_equipment,name='new_equipment'),
    url(r'^add_action', views.add_action, name='add_action'),
    url(r'^get_actions', views.get_actions, name='get_actions'),
    url(r'^get_file', views.get_file, name='get_file'),
    url(r'^$',views.equipment,name='equipment'),
]
