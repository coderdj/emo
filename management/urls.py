from django.conf.urls import url
from django.views.generic.base import TemplateView
from django.contrib.auth.decorators import login_required
from management import views

urlpatterns = [

    url(r'^update_user', views.update_user, name='update_user'),
    url(r'^shift_rules', views.shift_rules, name='shift_rules'),
    url(r'^shift_calendar', login_required(TemplateView.as_view(template_name="management/shift_calendar.html"))),
    url(r'^get_user_list', views.get_user_list, name='get_user_list'),
    #url(r'^shift_management', views.shift_management, name='shift_management'),
    url(r'^get_hs', views.GetHs, name="get_hs"),
    url(r'^set_hs', views.SetHs, name="set_hs"),
    url(r'$', login_required(views.get_user_list), name="user_management")
]
