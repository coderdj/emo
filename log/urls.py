from django.conf.urls import url
from django.views.generic.base import TemplateView
from django.contrib.auth.decorators import login_required
from log import views

urlpatterns = [

    url(r'^new_comment', views.new_comment, name='new_comment'),
    url(r'^new_log_entry', views.new_log_entry, name='new_log_entry'),
    url(r'^get_dispatcher_log', views.get_dispatcher_log, name='get_dispatcher_log'),
    url(r'^getstatus', views.get_status, name='get_status'),
    url(r'^newstatus', views.add_status, name='add_status'),
    url(r'$', login_required(views.log), name="log")
]
