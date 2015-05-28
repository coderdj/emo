from pymongo import MongoClient
from django.contrib.auth.decorators import login_required
from json import dumps
from django.shortcuts import HttpResponse

from bokeh.plotting import figure
from bokeh.resources import CDN
from bokeh.embed import components

import numpy as np

# These options will be set somewhere else later?
online_db_name = "online"
runs_db_collection = "runs"
mongodb_address = "localhost"
mongodb_port = 27017

# Connect to pymongo
client = MongoClient(mongodb_address, mongodb_port)
db = client[online_db_name]


def getwaveform():
    return


@login_required
def get_aggregate_list(request):

    """
    Get a list of aggregate histograms available
    """

    collection = db["monitor_histograms"]
    fields = collection.distinct("name")

    return HttpResponse(dumps(fields), content_type='application/json')

"""
def make_2d_datasource():


    month = []
    year = []
    color = []
    rate = []
    for y in years:
        for m in months:
            month.append(m)
            year.append(y)
            monthly_rate = data[m][y]
            rate.append(monthly_rate)
            color.append(colors[min(int(monthly_rate)-2, 8)])

    # EXERCISE: create a `ColumnDataSource` with columns: month, year, color, rate
    source = ColumnDataSource(
        data=dict(
            month=month,
            year=year,
            color=color,
            rate=rate,
        )
)
"""


@login_required
def get_aggregate_plot(request):

    """
    Get an aggregate plot by name
    :param request: must be a GET request with 'name' set. Return nothing otherwise
    """

    collection = db['monitor_histograms']

    if request.method != "GET" or 'name' not in request.GET.keys():
        return HttpResponse({}, content_type="application/json")

    plot_doc = collection.find_one({"name": str(request.GET['name'])})
    if plot_doc is None:
        return HttpResponse({}, content_type="application/json")

    # Now just a matter of reformatting
    if plot_doc['type'] != 'h1' and plot_doc['type'] != 'scatter':
        return HttpResponse({}, content_type="application/json")

    plot = figure(title=plot_doc['name'], background_fill="#FFFFFF",
                  width=400, plot_height=400, logo=None, tools="save,box_zoom,reset")
    plot.border_fill = "#EBEBEB"

    if plot_doc['type'] == 'h1':
        dat = plot_doc['data']
        dat.pop()
        trim = np.trim_zeros(dat, trim='b')
        edges = []
        for i in range(0, len(trim)+1):
            edges.append(plot_doc['xaxis']['min'] +
                         i*((plot_doc['xaxis']['max']-plot_doc['xaxis']['min'])/plot_doc['xaxis']['bins']))

        plot.quad(top=trim, bottom=0, left=edges[:-1], right=edges[1:], fill_color="#036564", line_color="#033649")
        plot.legend.orientation = "top_left"
        plot.xaxis.axis_label = "x"
        plot.yaxis.axis_label = 'counts'
    elif plot_doc['type'] == 'scatter':
        if not isinstance(plot_doc['data'], dict) and ['x', 'y'] not in plot_doc['data']['keys']:
            return HttpResponse({}, content_type="application/json")
        plot.scatter(plot_doc['data']['x'], plot_doc['data']['y'], fill_alpha=0.6, line_color=None)

    script, div = components(plot, CDN)

    ret = {"script": script, "div": div}
    return HttpResponse(dumps(ret), content_type="application/json")
