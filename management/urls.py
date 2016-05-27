from django.conf.urls import url
from django.views.generic.base import TemplateView
from django.contrib.auth.decorators import login_required
from management import views

urlpatterns = [

    url(r'^update_user', views.update_user, name='update_user'),
    url(r'^shift_rules', views.shift_rules, name='shift_rules'),
    url(r'^shift_calendar', views.shift_calendar, name="shift_calendar"),
    url(r'^get_user_list', views.get_user_list, name='get_user_list'),
    #url(r'^shift_management', views.shift_management, name='shift_management'),
    url(r'^get_current_shifter', views.GetCurrentShifter, name='get_current_shifter'),
    url(r'^get_shift_stats', views.GetShiftStats, name='get_shift_stats'),
    url(r'^get_shifts', views.GetShifts, name='get_shifts'),
    url(r'^get_hs', views.GetHs, name="get_hs"),
    url(r'^set_hs', views.SetHs, name="set_hs"),
    url(r'$', login_required(views.get_user_list), name="user_management")
]
