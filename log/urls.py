from django.conf.urls import url
from django.views.generic.base import TemplateView
from django.contrib.auth.decorators import login_required
from log import views

urlpatterns = [

    url(r'^new_comment', views.new_comment, name='new_comment'),
    url(r'^new_log_entry', views.new_log_entry, name='new_log_entry'),
    url(r'$', login_required(views.log), name="log")
]
