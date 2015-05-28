from django.conf.urls import include, url
from django.contrib import admin
from django.views.generic.base import TemplateView
from django.contrib.auth.decorators import login_required
from monitor import views
urlpatterns = [
    
    url(r'^eventdisplay', login_required(TemplateView.as_view(template_name="monitor/eventdisplay.html"))),
    url(r'^waveformdisplay', login_required(TemplateView.as_view(template_name="monitor/waveformdisplay.html"))),
    url(r'^diagnostics', login_required(TemplateView.as_view(template_name="monitor/diagnostics.html"))),
    url(r'^get_aggregate_list', login_required(views.get_aggregate_list), name="get_aggregate_list"),
    url(r'^get_aggregate_plot', login_required(views.get_aggregate_plot), name="get_aggregate_plot"),
    url(r'^getwaveform', login_required(views.getwaveform), name="getwaveform"),

]
