from django.conf.urls import include, url
from django.contrib import admin
from django.views.generic.base import TemplateView
from django.contrib.auth.decorators import login_required
from monitor import views
urlpatterns = [
    
    url(r'^eventdisplay', login_required(TemplateView.as_view(template_name="monitor/eventdisplay.html"))),
    url(r'^pax_display', login_required(TemplateView.as_view(template_name="monitor/pax_display.html"))),    
    url(r'^waveforms', login_required(TemplateView.as_view(template_name="monitor/waveformdisplay.html"))),
    url(r'^diagnostics', login_required(TemplateView.as_view(template_name="monitor/diagnostics.html"))),
    url(r'^runstats', login_required(TemplateView.as_view(template_name="monitor/runstats.html"))),
    url(r'^get_aggregate_list', login_required(views.get_aggregate_list), name="get_aggregate_list"),
    url(r'^get_aggregate_plot', login_required(views.get_aggregate_plot), name="get_aggregate_plot"),
    url(r'^get_event_for_display', login_required(views.get_event_for_display), name="get_event_for_display"),
    url(r'^get_latest_display', login_required(views.get_latest_display), name="get_latest_display"),
    url(r'^noise_report', login_required(views.get_noise_spectra), name="get_noise_spectra"),
    url(r'^noise', login_required(views.noise_directory), name="noise_directory"),
    url(r'^get_event_as_json', login_required(views.get_event_as_json), name="get_event_as_json"),
    url(r'^get_calendar_events', login_required(views.get_calendar_events),
        name='get_calendar_events'),
 ]
