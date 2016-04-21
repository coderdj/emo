from pymongo import MongoClient, ASCENDING, DESCENDING
from django.contrib.auth.decorators import login_required
from json import dumps, loads
from bson import json_util, objectid
from django.shortcuts import HttpResponse, HttpResponsePermanentRedirect
import pickle
from bokeh.plotting import figure
from bokeh.resources import CDN
from bokeh.embed import components
from bokeh.models import ColumnDataSource
#import mpld3
import numpy as np
from bokeh.models import Range1d
from bokeh.io import hplot, vplot, gridplot
from bokeh._legacy_charts import HeatMap
import time
import datetime
from datetime import date, timedelta
from django.shortcuts import render
from django.conf import settings
from monitor.models import ScopeRequest
from pandas import DataFrame
from bokeh.properties import value
import dateutil
import snappy

import logging

# Get an instance of a logger
logger = logging.getLogger(__name__)
#logger = logging.getLogger("emo")

# Connect to pymongo
client = MongoClient(settings.MONITOR_DB_ADDR)
db = client[settings.MONITOR_DB_NAME]

# Connect to buffer DB
bufferclient = MongoClient( settings.BUFFER_DB_ADDR)

@login_required
def get_waveform_run_list(request):
    """
    Return all run names for which there is a collection containing waveforms
    """

    retlist = []
    for collection in db.collection_names():
        if collection[-7:] == "_events" and db[collection].count() != 0:
            retlist.append(collection[:-7])
    return HttpResponse(dumps({"runs": retlist}), content_type="application/json")


@login_required
def get_event_as_json(request):

    run = ""
    if request.method == "GET" and "run" in request.GET:
        run = request.GET['run'] + "_events"
    else:
        for collection in db.collection_names():
            if collection[-7:] == "_events" and db[collection].count() != 0:
                run = collection
                break

    collection = db[run]

    event_number = 0
    if request.method == "GET" and "event" in request.GET:
        event_number = int(request.GET['event'])
    if event_number < 0:
        event_number = collection.count() -1
    if event_number >= collection.count():
        event_number = 0
    print(event_number);
    # Get the doc. If there is no doc return an empty dict
    try:
        docs = collection.find().sort("_id", -1)
        doc=docs[event_number]
    except:
        print("Error finding event")
        return HttpResponse({}, content_type="application/json")

    # Make it faster, just get the fields you need
    ret_doc = {}
    ret_doc['sum_waveforms'] = doc['sum_waveforms']
    ret_doc['peaks'] = doc['peaks']
    ret_doc['event_number'] = doc['event_number']
    ret_doc['dataset_name'] = doc['dataset_name']
    ret_doc['start_time'] = doc['start_time']
    ret_doc['event_number'] = event_number
    return HttpResponse(json_util.dumps(doc), content_type="application/json")

def strip_doc(doc):
    trigger_time_ns = (doc['start_time'])
    timestring = time.strftime("%Y/%m/%d, %H:%M:%S", time.gmtime(trigger_time_ns / 10 ** 9))
    ret = {"event_date": timestring, "run_name": doc['dataset_name'], "event_number": doc["event_number"],
           "sum_waveforms": doc["sum_waveforms"], "peaks": [], "pulses": [], "all_hits": []}

    for peak in doc['peaks']:
        minpeak = {
            "area": peak["area"],
            "type": peak["type"],
            "left": peak["left"],
            "right": peak["right"],
            "index_of_maximum": peak["index_of_maximum"],
            "n_contributing_channels": peak['n_contributing_channels'],
            "area_per_channel": peak["area_per_channel"],
            "hits": [],
        }
        for hit in peak['hits']:
            minpeak['hits'].append({"found_in_pulse": hit['found_in_pulse'],
                                    "channel": hit['channel'],})
        ret["peaks"].append(minpeak)

    for hit in doc['all_hits']:
        minhit = {
            "index_of_maximum": hit["index_of_maximum"],
            "channel": hit["channel"],
            "area": hit["area"],
            "left": hit["left"],
            "right": hit["right"],
            "found_in_pulse": hit["found_in_pulse"],
        }
        ret["all_hits"].append(minhit)

    
    for pulse in doc['pulses']:
        minpulse = {
            "baseline": pulse['baseline'],
            "left": pulse["left"],
            "right": pulse["right"],
            "channel": pulse["channel"],
            "raw_data": pulse["raw_data"]
        }
        ret["pulses"].append(minpulse)
    
    return ret
@login_required
def get_event_for_display(request):

    """
    Returns Boken plots for waveform display
        : full waveform
        : channel vs time plot
        optionally
            : hit pattern
    """
    print("Got request")
    # Get the doc. If there is no doc return an empty dict
    run = ""
    if request.method == "GET" and 'run' in request.GET:
        run = request.GET['run'] + "_events"
    else:
        for collection in db.collection_names():
            if collection[-7:] == "_events" and db[collection].count() != 0:
                run = collection
                break

    collection = db[run]

    event_number = 0
    if request.method == "GET" and "event" in request.GET:
        event_number = int(request.GET['event'])
    if event_number < 0:
        event_number = collection.count() -1
    if event_number >= collection.count():
        event_number = 0

    try:
        docs = collection.find().sort("_id", -1)
        doc=docs[event_number]
    except:
        return HttpResponse({}, content_type="application/json")

    #hits_plot = make_bokeh_hits_plot(doc['all_hits'])
    #waveform_plot = make_bokeh_waveform_plot(doc['sum_waveforms'], doc['peaks'])
    #hit_displays = make_bokeh_hit_displays(doc['peaks'])
    #hits_plot.x_range = waveform_plot.x_range

    #full_plot = gridplot([[waveform_plot], [hits_plot]],
    #                    toolbar_location="left" )



    #script, div = components(full_plot)

    #trigger_time_ns = (doc['start_time'])
    #timestring = time.strftime("%Y/%m/%d, %H:%M:%S", time.gmtime(trigger_time_ns / 10 ** 9))
    #print(timestring)
    ret = strip_doc(doc)
    ret['event_number']=event_number;
    #ret = {"event_date": timestring, "run_name":doc['dataset_name'], "event_number":doc['event_number'],
    #       'sum_waveforms':doc['sum_waveforms'], "peaks": doc['peaks'], "pulses": doc['pulses']}
    #ret = {"hits_script": hits_js, "hits_div": hits_div, "waveform_script": waveform_js,
    #      "waveform_div": waveform_div}
    #ret = {#"script": script, "div": div,
    #       'run_name': doc['dataset_name'], 'event_number': doc['event_number'], 'event_date': timestring }

    #ret['sum_waveforms'] = doc['sum_waveforms']
    #ret['peaks'] = doc['peaks']
    #ret['pulses'] = doc['pulses']
    #ret['event_number'] = event_number
    #ret['bulk'] = doc;
    #ret = json_util.loads(json_util.dumps(ret))
    print("Serving request")
    return HttpResponse(json_util.dumps(ret), content_type="application/json")


def make_bokeh_hits_plot(hit_list):

    """
    This makes a bokeh plot and returns the div/js elements
    """
    max_size = 100
    min_size = 10
    max_area = max(hit_list, key=lambda x:x['area'])['area']

    x = []
    y = []
    sizes = []
    colors = []
    for hit in hit_list:

        x.append(hit['index_of_maximum'])
        y.append(hit['channel'])
        if hit['is_rejected']:
            colors.append("#4fa783")
        else:
            colors.append("red")
        size = max_size*(hit['area']/max_area)
        if size < min_size:
            size = min_size
        sizes.append(size)

    plot = figure(background_fill=(200, 200, 200, 0.2),
                  width=1100, plot_height=300, logo=None, tools="save,box_zoom,reset",
                  x_axis_label = "Time (10 ns sample)", y_axis_label = "Channel", title_text_font_size=value('12pt'))
    plot.xaxis.axis_label_text_font_size = value("12pt")
    plot.yaxis.axis_label_text_font_size = value("12pt")

    plot.scatter(x, y, fill_color=colors, radius=sizes, fill_alpha=0.5, line_color="#AAAAAA", line_alpha=.8, line_width=1)
    plot.x_range = Range1d(0, 40000)
    plot.min_border_left = 60
    plot.min_border_right = 50
    plot.min_border_top = 0;
    plot.min_border_bottom = 20;
    return plot


def make_bokeh_waveform_plot(waveform_dict, peaks_list):

    """
    """

    plot = figure(background_fill=(200, 200, 200, 0.4),
                  width=1100, plot_height=300, logo=None, tools="save,box_zoom,reset",
                  #x_axis_label = "Time (samples)",
                  y_axis_label = "Sum Waveform", title_text_font_size=value('12pt'))
    plot.xaxis.axis_label_text_font_size = value("12pt")
    plot.yaxis.axis_label_text_font_size = value("12pt")
    #colors = ["#63535B", "#6D1A36", "#FCD0A1", "#53917E","#B1B695"]
    colors = ["#FF0000", "#333333"]
    idx = 0
    max_y = 0

    for waveform in waveform_dict:
        if waveform['name'] not in ['veto_raw', 'tpc_raw']:
            continue
        x = []
        y = []
        time_bin = 0
        i=0
        while i < len(waveform['samples']):
            if waveform['samples'][i] != 'z':
                x.append(time_bin)
                y.append(float(waveform['samples'][i]))
                if float(waveform['samples'][i]) > max_y:
                    max_y = float(waveform['samples'][i])
                time_bin += 1
                i+=1
            else:
                i += 1
                nzeros = int(waveform['samples'][i])
                if nzeros > 10:
                    for j in range(0, 3):
                        x.append(time_bin+j)
                        y.append(0)
                    time_bin += nzeros
                    for j in range(0, 3):
                        x.append(time_bin - 3 + j)
                        y.append(0)
                else:
                    for j in range(0, nzeros):
                        x.append(time_bin)
                        y.append(0)
                        time_bin += 1
                i+=1
        if waveform['name'] == 'veto_raw':
            thecolor = "#FF0000"
        else:
            thecolor = '#5992c2'
            #thecolor = "#333333"
        plot.line(x, y, color=thecolor, legend=waveform['name'], line_width=1)
        plot.min_border_left = 60

        plot.min_border_right = 50
        idx += 1
    plot.x_range = Range1d(0, 40000)
    # plot.y_range = Range1d(0, 1.1*max_y)
    plot.min_border_top = 20;
    plot.min_border_bottom = 0;

    # Annotate peaks
    
    # First have to sort. S2 by area. S1 by coincidence. Uknown also by area.
    s2_indices = []
    s1_indices = []
    unknown_indices = []    
    for peak_index in range(0, len(peaks_list)):
        peak = peaks_list[peak_index]
        appended = False
        if peak['type'] == 's1':
            for index in range(0, len(s1_indices)):
                if peak['n_contributing_channels'] > peaks_list[s1_indices[index]]['n_contributing_channels']:
                    s1_indices.insert(index, peak_index)
                    appended = True
                    break
            if not appended:
                s1_indices.append(peak_index)
        elif peak['type'] == 's2':
            for index in range(0, len(s2_indices)):
                if peak['area'] > peaks_list[s2_indices[index]]['area']:
                    s2_indices.insert(index, peak_index)
                    appended = True
                    break
            if not appended:
                s2_indices.append(peak_index)
        elif peak['type'] == 'unknown':
            for index in range(0, len(unknown_indices)):
                if peak['area'] > peaks_list[unknown_indices[index]]['area']:
                    unknown_indices.insert(index, peak_index)
                    appended = True
                    break
            if not appended:
                unknown_indices.append(peak_index)
    s1_count = 0
    s2_count = 0
    unknown_count = 0
    for index in range(0, len(peaks_list)):
        peak = peaks_list[index]
        peak_order = 0
        # peak_order myst be position in s1_indices
        if index in s1_indices:
            ptype = 's1'            
            peak_order = s1_indices.index(index)
        elif index in s2_indices:
            ptype = 's2'
            peak_order = s2_indices.index(index)
        elif index in unknown_indices:
            ptype = 'unknown'
            peak_order = unknown_indices.index(index)
        else:
            continue
        name = ""    
        color = "#5992c2";
        if ptype == "s1":
            name = "s1_" + str(peak_order)
            #s1_count += 1
        elif ptype == "s2":
            name = "s2_" + str(peak_order)
            #s2_count += 1
            color = "#ff0202"
        else:
            name = "unknown_" + str(peak_order)
            #unknown_count += 1
            color = "#a7a7a7"
        
        
        plot.text( peak['left'], peak['height'], text=[name], text_color=color,  text_font_size=value('10pt'))
    

    return plot

def make_bokeh_hit_displays(peaks):

    """
    Make hit displays of top/bottom arrays
    """

    largestS1 = None
    largestS2 = None
    for peak in peaks:

        if peak['type'] == 's1':
            if largestS1 is None or peak['area'] > largestS1['area']:
                largestS1 = peak
        if peak['type'] == 's2':
            if largestS2 is None or peak['area'] > largestS2['area']:
                largestS2 = peak

    S1Plot = S2Plot = None
    if largestS1 is not None:
        S1Plot = make_hit_display(largestS1, "S1")
    if largestS2 is not None:
        S2Plot = make_hit_display(largestS2, "S2")

    return {"s1": S1Plot, "s2": S2Plot}

def make_hit_display(peak, type):

    """
    Make the colored display
    """
    g_pmt_map = settings.PMT_MAP

    if len(peak['area_per_channel']) > len(g_pmt_map):
        return None

    x = []
    y = []
    radii = []
    colors = []
    maxhit = max(peak['area_per_channel'])
    for i in range(0, len(peak['area_per_channel'])):
        if i > 98:
            continue
        hit = peak['area_per_channel'][i]
        if hit<0:
            hit = 0
        x.append(g_pmt_map[i]['x'])
        y.append(g_pmt_map[i]['y'])
        radii.append(20.*(hit/maxhit) +1)
        num = int((254*(hit/maxhit)+1))
        colors.append("#%02X%02X%02X" % (num, 125+(125-num), 255-num))

    plot = figure(title="Largest" + type, background_fill=(200, 200, 200, 0.3),
                  width=400, plot_height=300, logo=None, tools="save,box_zoom,reset",
                  x_axis_label = "mm", y_axis_label = "mm", title_text_font_size=value('12pt'))

    plot.scatter(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color="#666666")
    plot.xaxis.axis_label_text_font_size = value('12pt')
    plot.yaxis.axis_label_text_font_size = value('12pt')
    return plot


@login_required
def get_aggregate_list(request):

    """
    Get a list of aggregate histograms available
    """

    collection = db["monitor_histograms"]
    retdict = {}
    for entry in collection.find():
        if entry['category'] not in retdict:
            retdict[entry['category']] = {}
        if entry['type'] not in retdict[entry['category']]:
            retdict[entry['category']][entry['type']] = []
        if entry['name'] not in retdict[entry['category']][entry['type']]:
            retdict[entry['category']][entry['type']].append(entry['name'])

    return HttpResponse(dumps(retdict), content_type='application/json')

def get_runs_list(get_request):

    # Mongo Objects                                                                 
    client = MongoClient(settings.RUNS_DB_ADDR)
    db = client[ settings.RUNS_DB_NAME ]

    collection = db[settings.RUNS_DB_COLLECTION]
    
    run_list = []
    query = {}
    if "run_mode" in get_request:
        query['source.type'] = get_request['run_mode']

    if "all_runs" in get_request and get_request['all_runs']==1:
        cursor = collection.find(query)
    elif "current_run" in get_request and get_request['current_run'] == 1:
        cursor = collection.find(query).limit(1).sort({"_id": -1})
    else:
        if "start_date" in get_request:
            query['starttimestamp'] = { "$gt"
                                        : datetime.datetime.combine
                                        (get_request['startdate'],
                                         datetime.datetime.min.time() )}
        if "end_date" in get_request:
            if 'starttimestamp' in get_request:
                query['starttimestamp']['$lt'] = (
                    datetime.datetime.combine(get_request['enddate'],
                                              datetime.datetime.max.time() )
                    )
            else:
                query[ 'starttimestamp' ]= { "$lt" : datetime.datetime.combine(
                        get_request['enddate'],datetime.datetime.max.time() )}
        cursor = collection.find(query)

    if cursor is None:
        return []

    for run in cursor:
        run_list.append(run['name'])

    return run_list

@login_required
def get_available_plots(request):

    """
    Gets a list of plots available for a certain data range
    """

    if request.method != "GET":
        return

    # Mongo Objects
    client = MongoClient(settings.MONITOR_DB_ADDR)
    db = client[ settings.MONITOR_DB_NAME ]

    # Build the run list based on info in request
    run_list = get_runs_list(request.GET)    
    if run_list is None or len(run_list) == 0:
        return 
    
    # Loop through collections in run list to build available plots
    plots = {}
    for run in run_list:
        run_name = run + "_plots"
        if run_name not in db.collection_names():
            continue
        collection = db[run_name]        
        for doc in collection.find():
            if doc['type'] not in plots:
                plots[doc['type']] = []
            if doc['name'] not in plots[doc['type']]:
                plots[doc['type']].append(doc['name'])

                
    return HttpResponse(dumps(plots), content_type="application/json")


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

def combine_aggregates(master_doc, doc):
    ''' 
    combine an aggregate document by adding bins
    '''
    max_points = 5000

    if master_doc['type'] != doc['type']:
        return master_doc

    if master_doc['type'] == 'h1':
        master_doc['data'] = np.add(master_doc['data'], doc['data']).tolist()
    elif master_doc['type'] == 'h2':
        for i in range(0, len(master_doc['data'])):
            master_doc['data'][i] = np.add(master_doc['data'][i], 
                                           doc['data'][i]).tolist()
    elif master_doc['type'] == 'scatter' and len(master_doc['data']['x']) < max_points:
        if (len(master_doc['data']['x']) + len(doc['data']['x'])) > max_points:
            limiter = max_points - (len(master_doc['data']['x'])+len(doc['data']['x']))
        addlist_x = []
        addlist_y = []
        if limiter > 0 and limiter < len(doc['data']['x']):
            addlist_x = doc['data']['x'][:limiter]
            addlist_y = doc['data']['y'][:limiter]
        elif limiter>0:
            addlist_x = doc['data']['x']
            addlist_y = doc['data']['y']
        else:
            return master_doc
        master_doc['data']['x'] = np.concatenate([master_doc['data']['x'], addlist_x]).tolist()
        master_doc['data']['y'] = np.concatenate([master_doc['data']['y'], addlist_y]).tolist()

    return master_doc

@login_required
def get_plot(request):

    """
    Get an aggregate plot by name
    :param request: must be a GET request with 'name' set. Return nothing otherwise
    """

    if request.method != "GET" or 'name' not in request.GET.keys():
        return HttpResponse({}, content_type="application/json")
        
    plot_name = request.GET['name']

    # Mongo Objects                                                                 
    client = MongoClient(settings.MONITOR_DB_ADDR)
    db = client[ settings.MONITOR_DB_NAME ]

    # Build the run list based on info in request               
    run_list = get_runs_list(request.GET)
    if run_list is None or len(run_list) == 0:
        return

    # Loop through collections in run list to build available plots        
    master_doc = None
    used_runs = []
    for run in run_list:
        run_name = run + "_plots"
        if run_name not in db.collection_names():
            continue
        used_runs.append(run)
        collection = db[run_name]
        for doc in collection.find():            
            if doc['name'] == plot_name:
                if master_doc == None:
                    master_doc = doc
                else:
                    master_doc = combine_aggregates(master_doc, doc)

    ret_dict = {"plot": master_doc, "runs": used_runs}

    if master_doc is None:
        return HttpResponse({}, content_type="application/json")
    else:
        return HttpResponse(json_util.dumps(ret_dict), content_type="application/json")
    # Now just a matter of reformatting
    if plot_doc['type'] != 'h1' and plot_doc['type'] != 'scatter' and plot_doc['type'] != 'h2':
        return HttpResponse({}, content_type="application/json")

    plot = figure(title=plot_doc['name'], background_fill="#FFFFFF",
                  width=400, plot_height=400, logo=None, 
                  tools="save,box_zoom,reset", webgl=True)
    if 'xaxis' in plot_doc and 'label' in plot_doc['xaxis']:
        plot.xaxis.axis_label = plot_doc['xaxis']['label']
    if 'yaxis' in plot_doc and 'label' in plot_doc['yaxis']:
        plot.yaxis.axis_label = plot_doc['yaxis']['label']
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
    elif plot_doc['type'] == 'h2':
        x_vals = []
        y_vals = []
        color = []
        z_vals = []
        max_list = []
        for a in plot_doc['data']:
            max_list.append(max(a))
        max_value = int(max(max_list))
        x_size = plot_doc['xaxis']['max'] - plot_doc['xaxis']['min'] / plot_doc['xaxis']['bins']
        y_size = plot_doc['yaxis']['max'] - plot_doc['yaxis']['min'] / plot_doc['yaxis']['bins']
        for row in range(0, len(plot_doc['data'])):
            for item in range(0, len(plot_doc['data'][row])):
                x_vals.append(row * x_size)
                y_vals.append(item * y_size)
                value = plot_doc['data'][row][item]
                color.append("#%02x%02x%02x" % (255, 255 - int(value / max_value * 255.0), 255 - int(value / max_value * 255.0)))
                z_vals.append(value)
                              
        source = ColumnDataSource(
            data=dict(xvals=x_vals, 
                      yvals=y_vals, 
                      color=color, 
                      z_value=z_vals))
        plot.rect('xvals', 'yvals',1, 1, 
                  source=source, color="color")
        plot.x_range=Range1d(0, plot_doc['xaxis']['max'])
        plot.y_range=Range1d(0, plot_doc['yaxis']['max'])
        #x_range=weeks, y_range=list(reversed(days)),
        #x_axis_location="above",
        #     color="color", line_color=None,
        #tools="resize,hover,previewsave", title="\"Party\" Disturbance Calls in LA",
        #plot_width=900, plot_height=400, toolbar_location="left")

    script, div = components(plot, CDN)
    
    ret = {"script": script, "div": div}
    print(ret)
    return HttpResponse(dumps(ret), content_type="application/json")


@login_required
def get_latest_display(request):

    print("HERE")
    collection = db['monitor_plots']
    try:
        docs = collection.find().sort("_id", -1)[:1]
        doc=docs[0]
    except:
        return HttpResponse({}, content_type="application/json")

    print("Found")
    fig = pickle.loads(doc['data'])

    print(fig)
    print(type(fig))
    #plt = mpld3.fig_to_dict(fig)
    plot = mpld3.fig_to_html(fig)
    return HttpResponse(dumps({'figure': plot, 'run_name': doc['run_name'], 'event_number': doc['event_number'],
                               'event_date': doc['event_date']}), content_type="application/json")

@login_required
def noise_directory(request):

    """
    Show directory of noise files from noise DB
    """

    #noise_db_name = "noise"
    noise_directory_collection = "directory"
    #ndb = client[noise_db_name]
    collection = db[noise_directory_collection]

    max_entries = 100000
    run_list = collection.find().sort("_id", -1)[:max_entries]

    retvals = []
    for run in run_list:
        thedict = { "run_name": run["run_name"], 
                    "collection": run["collection"],
                    "date": run["date"], 
                    "dateSort": time.strftime("%Y%m%d",
                                            run["date"].timetuple())
                    }
        if "comments" in run:
            thedict["comments"] = run["comments"]
        if "approved" in run:
            thedict["approved"] = True
            thedict["approved_date"] = run["approved"]["date"]
            thedict["approved_user"] = run["approved"]["user"]
        thedict["channels"] = ndb[run["run_name"]].count()
        retvals.append(thedict)    

    return render(request, 'monitor/noise.html', {"run_list": retvals})


def chunks(l, n):
    """ Yield successive n-sized chunks from l.
    """
    for i in range(0, len(l), n):
        yield l[i:i+n]


@login_required
def get_noise_spectra(request):

    """
    Return the noise spectra
    """
    noise_db_name = "noise"
    ndb = client[noise_db_name]

    if request.method != 'GET' or 'run' not in request.GET:
        return render(request, "monitor/event_detail.html", {})
    
    collection_name = request.GET['run']

    if 'approved' in request.GET:        
        user = request.user.username
        date = datetime.datetime.now()
        
        # update the doc
        doc = None
        try:
            ndb['directory'].update({"collection": collection_name}, 
                                    {"$set": {"approved": {"user": user, 
                                                           "date": date}}}, 
                                    upsert = False)
        except: 
            return HttpResponsePermanentRedirect("/monitor/noise.html")
        return HttpResponsePermanentRedirect("/monitor/noise.html")

    # Get the control doc for the header
    control_doc = None
    try:
        control_doc = ndb['directory'].find_one({"collection": collection_name})
    except:
        print("No control doc")
    
    collection = ndb[collection_name]

    # Get the doc. If there is no doc return an empty dict
    try:
        docs = collection.find().sort("_id", 1)
    except:
        return render(request, "monitor/event_detail.html", {})
    if(docs.count() == 0):
        return HttpResponsePermanentRedirect("/monitor/noise.html")


    plots=[]
    for doc in docs:
        plot = figure(title=doc['name'], background_fill=(200, 200, 200, 0.3),
                      width=350, plot_height=300, logo=None, tools="save,box_zoom,reset", x_axis_label = "Energy [p.e.]", y_axis_label = "counts", title_text_font_size=value('12pt'))

        hist, edges = np.histogram(doc['data'], density=True, bins=100)

        plot.quad(top=hist, bottom=0, left=edges[:-1], right=edges[1:], fill_color="#036564", line_color="#033649")
        plot.legend.orientation = "top_left"
        plots.append(plot)

    splitlist = list(chunks(plots,3))
    moreplots = []
    for chunk in splitlist:
        if(len(chunk)==3):
            theplot = gridplot([[chunk[0], chunk[1], chunk[2]]])
        elif(len(chunk)==2):
            theplot = gridplot([[chunk[0], chunk[1]]])
        else:
            theplot = chunk[0]
        script, div = components(theplot)
        moreplots.append({"script": script, "div": div})

    #full_plot = gridplot(list(chunks(plots,4)))
    #script, div = components(full_plot)

    #ret = {"script": script, "div": div, 'run_name': doc['run'] }
    ret = {"plots": moreplots, 'run_name': collection_name}

    if control_doc is not None:
        if "approved" in control_doc:
            ret["approved"] = True
            ret["approved_user"] = control_doc["approved"]["user"]
            ret["approved_date"] = control_doc["approved"]["date"]

    return render(request, "monitor/event_detail.html", ret)

def get_uptime(request):
    """
    Gets total uptime calculated from runs DB
    returns:    
    {'tpc': [
       { "month": int, 
         "day": int,
         "uptime": {
           "Cs137": .1,
           "DarkMatter": .6,
         }
       },
       ...
    ],
    "muon_veto": [same],
    }
    """
    last_days=30
    onlyDM=True
    if request.method != 'GET':
        return
    if 'dm' not in request.GET or request.GET['dm'] == False:
        onlyDM = False
    
    if 'this_month' in request.GET:
        last_days = date.today().day - 1

    # Make DB query
    runs_client = MongoClient(settings.RUNS_DB_ADDR)
    runsdb = runs_client[settings.RUNS_DB_NAME]

    runs_coll = runsdb[settings.RUNS_DB_COLLECTION]
    
    d = date.today() - timedelta(days=last_days)
    dt= datetime.datetime.combine(d, datetime.datetime.min.time())
    
    query_set=[]
    try:
        query_set = runs_coll.find({"start": 
                                    {"$gt": dt}}).sort("start", ASCENDING)
    except:
        logger.error("Exception trying to query runs DB")

    day_hist_tpc = []
    day_hist_muon_veto = []

    for doc in query_set:
        # figure out which bin this belongs in
        endtime = datetime.datetime.now()
        if "end" in doc.keys():
            endtime = doc['end']

        if doc['start'].day == endtime.day:
            incval = (endtime-doc['start']).seconds/(3600*24)
            bin_no = (doc['start']-datetime.datetime.combine(d,datetime.datetime.min.time())).days

            logger.error(bin_no)
            if doc['detector'] == 'tpc':
                while bin_no >= len(day_hist_tpc):
                    day_hist_tpc.append({})
                logger.error(bin_no)
                logger.error(len(day_hist_tpc))
                if doc['source']['type'] in day_hist_tpc[bin_no]:
                    day_hist_tpc[bin_no][doc['source']['type']]+=incval
                else:
                    day_hist_tpc[bin_no][doc['source']['type']]=incval
            if doc['detector'] == 'muon_veto':
                while bin_no >= len(day_hist_muon_veto):
                    day_hist_muon_veto.append({})
                if doc['source']['type'] in day_hist_muon_veto[bin_no]:
                    day_hist_muon_veto[bin_no][doc['source']['type']]+=incval
                else:
                    day_hist_muon_veto[bin_no][doc['source']['type']]=incval
        else:
            stime = doc['start']
            while (endtime-stime).days>=0:
                midnight = datetime.datetime.combine(datetime.date(stime.year, stime.month, stime.day), datetime.datetime.max.time())
                if (endtime-stime).days==0:
                    midnight=endtime
                incval = (midnight-stime).seconds/(3600*24)
                bin_no = (stime-datetime.datetime.combine(d,datetime.datetime.min.time())).days
                if doc['detector'] == 'tpc':
                    while bin_no >= len(day_hist_tpc):
                        day_hist_tpc.append({})
                    if doc['source']['type'] in day_hist_tpc[bin_no]:
                        day_hist_tpc[bin_no][doc['source']['type']]+=incval
                    else:
                        day_hist_tpc[bin_no][doc['source']['type']]=incval
                if doc['detector'] == 'muon_veto':
                    while bin_no >= len(day_hist_muon_veto):
                        day_hist_muon_veto.append({})
                    if doc['source']['type'] in day_hist_muon_veto[bin_no]:
                        day_hist_muon_veto[bin_no][doc['source']['type']]+=incval
                    else:
                        day_hist_muon_veto[bin_no][doc['source']['type']]=incval
                
                stime=stime + timedelta(days=1)
    ret_doc = {"tpc":[],"muon_veto":[]}
    for i in range(0, len(day_hist_tpc)):
        month = (d+timedelta(days=i)).month
        day = (d+timedelta(days=i)).day
        year = (d+timedelta(days=i)).year
        ret_doc['tpc'].append({"day": day, "month": month, "year": year,
                           "uptime": day_hist_tpc[i]})
        if i < len(day_hist_muon_veto):
            ret_doc['muon_veto'].append({"day":day, "month": month, "year": year,
                                         "uptime": day_hist_muon_veto[i]})
    
    if 'this_month' in request.GET:
        total = {}
        for entry in ret_doc['tpc']:
            for det in entry['uptime'].keys():
                if det not in total:
                    total[det] = 0.
                total[det] += entry['uptime'][det]
        for det in total.keys():
            total[det]/=last_days
        ret_doc = total
    return HttpResponse(dumps(ret_doc), content_type="application/json")

@login_required
def get_calendar_events(request):
    '''
    Gets runs from database and puts into calendar format.
    Must take arguments "start" and "end" as ISO dates with
    format "2013-12-01" as a GET request
    '''

    if request.method != 'GET':
        return

    if "start" not in request.GET or "end" not in request.GET:
        return


    runs_client = MongoClient(settings.RUNS_DB_ADDR)
    rundb = runs_client[settings.RUNS_DB_NAME]
    run_coll = rundb[settings.RUNS_DB_COLLECTION]

    start_time = dateutil.parser.parse(request.GET['start'])
    end_time = dateutil.parser.parse(request.GET['end'])
    docs =[]
    try:
        docs = run_coll.find({
            "start": {"$gt": start_time,
                      "$lt": end_time  }
        })
    except:
        print("Error finding event")
        return HttpResponse({}, content_type="application/json")
    
    # format and return as http response
    retdoc = []
    for run in docs:
        endtimestamp = run['start']
        if "end" in run:
            endtimestamp = run["end"]
        newdoc={"source": run['source']['type'],
                    "runname": run['name'],
                    "start": run['start'].strftime("%Y-%m-%dT%H:%M:%S"),
                    "detector": run['detector'], 
                    "user": run['user'],
                    "end": endtimestamp.strftime("%Y-%m-%dT%H:%M:%S"),
        }        
        if run['detector'] == 'tpc':
            newdoc['title'] = "Run "+ str(run['number'])
        else:
            newdoc['title'] = "Run " + str(run['name'])
        retdoc.append(newdoc)

    return HttpResponse(dumps(retdoc), content_type="application/json")

@login_required
def getWaveform(request):
    
    if ( request.method == 'GET' and 'server' in request.GET and 
         'database' in request.GET and 'collection' in request.GET and 'id' in request.GET ):  
        server = request.GET['server']  
        database = request.GET['database']  
        collection = request.GET['collection']  
        doc_id = objectid.ObjectId(request.GET['id'])

        searchdict = {"_id": doc_id}  
        if "module" in request.GET:  
            searchdict["module"] = int(request.GET['module'])  
        if "channel" in request.GET:  
            searchdict["channel"] = int(request.GET['channel'])  
  

        if server == "eb0" or server=="eb2":
            try:
                if database == "untriggered" and server=='eb0':
                    client = MongoClient(settings.BUFFER_DB_ADDR)
                    db = client[settings.BUFFER_DB_REPL]
                elif database=="untriggered" and server=="eb2":
                    client=MongoClient("mongodb://"+
                                       settings.MONGO_ADMIN + ":" +
                                       settings.MONGO_ADMIN_PASS + "@eb2:27001/admin")
                    db=client["untriggered"]
                else:
                    client = MongoClient(settings.MV_DB_ADDR)
                    db = client[settings.MV_BUFFER_REPL]
                retdoc = db[collection].find_one(searchdict)
                retjson = {}

                if retdoc is not None:
                    data = snappy.decompress(retdoc['data'])
                    intformat = np.frombuffer(data,np.int16)
                    bins = []
                    print(bins)
                    for i in range(0, len(intformat)):
                        bins.append([i, int(intformat[i])])
                        #bins.append([i, 0x3fff-int(intformat[i])])                                       
                    retjson = { "adc_value": bins, "time": retdoc['time']}

                    client.close()
                return HttpResponse(dumps(retjson),
                                    content_type='application/json')
            except:
                print("Can't connect to server")
                return HttpResponse([], content_type="application/json")
        try:  
            client = MongoClient(server)
        except:  
            print("Can't connect to server")  
            return HttpResponse([], content_type="application/json")  

        if database in client.database_names() and collection in client[database].collection_names():  
            retdoc = client[database][collection].find_one(searchdict)
            retjson = {}
            if retdoc is not None:
                data = snappy.decompress(retdoc['data'])
                intformat = np.frombuffer(data,np.int16)
                bins = []
                print(bins)
                for i in range(0, len(intformat)):
                    bins.append([i, int(intformat[i])])
                    #bins.append([i, 0x3fff-int(intformat[i])])
                retjson = { "adc_value": bins, "time": retdoc['time']}
                
            client.close()
            return HttpResponse(dumps(retjson),
                                content_type='application/json')

        client.close()  

    return HttpResponse([], content_type="application/json")  


@login_required
def getDatabase(request):    

    
    if request.method == 'GET' and 'server' in request.GET:
        server = request.GET['server']
        
        if server == "eb0" or server=="eb2":
            retlist = [settings.BUFFER_DB_REPL]
            if server=='eb0':
                retlist.append(settings.MV_BUFFER_REPL)
            return HttpResponse(dumps(retlist),
                            content_type='application/json')

        try:
            client = MongoClient(server)
        except:
            print("Can't connect to server")
            return HttpResponse([], content_type="application/json")
        
        retlist = client.database_names()
        client.close()
        return HttpResponse(dumps(retlist),
                            content_type='application/json')

    
    return HttpResponse([], content_type="application/json")

@login_required
def getCollection(request):

    
    if request.method == 'GET' and 'server' in request.GET and 'database' in request.GET:
        server = request.GET['server']
        database = request.GET['database']

        if server == "eb2":
            try:
                if database=="untriggered":
                    client=MongoClient("mongodb://"+settings.MONGO_ADMIN+
                                       ":"+settings.MONGO_ADMIN_PASS+
                                       "@eb2:27001/admin")
                    db=client[database]
                    coll_list = db.collection_names()
                    retlist = []
                    for name in coll_list:
                        if db[name].count() > 0:
                            retlist.append(name)
                    retlist.sort()
                    client.close()
                    return HttpResponse(dumps(retlist), content_type='application/json')
            except Exception as e:
                return HttpResponse(dumps([str(e)]), content_type="application/json")
                print("Can't connect to eb2")
        elif server == "eb0":
            try:
                if database == "untriggered":
                    client = MongoClient(settings.BUFFER_DB_ADDR)                
                else:
                    client = MongoClient(settings.MV_DB_ADDR)
                db = client[database]
                coll_list = db.collection_names()
                retlist = []
                for name in coll_list:
                    if client[database][name].count() > 0:
                        retlist.append(name)
                retlist.sort()
                client.close()
                return HttpResponse(dumps(retlist),
                                    content_type='application/json')
            except:
                print("Can't connect to server")
                logger.error("Can't connect to " + settings.BUFFER_DB_ADDR + " at " + settings.BUFFER_DB_REPL)
                return HttpResponse(["error"], content_type="application/json")
        try:
            client = MongoClient(server)
        except:
            print("Can't connect to server")
            return HttpResponse([], content_type="application/json")
        if database in client.database_names():
            coll_list = client[database].collection_names()
            retlist=[]
            for name in coll_list:
                if client[database][name].count() > 1:
                    retlist.append(name)
            client.close()
            return HttpResponse(dumps(retlist),
                                content_type='application/json')
        client.close()
    
    return HttpResponse([], content_type="application/json")

@login_required
def getModules(request):
    
    if request.method == 'GET' and 'server' in request.GET and 'database' in request.GET and 'collection' in request.GET:
        server = request.GET['server']
        database = request.GET['database']
        collection = request.GET['collection']
    
        if server == "eb0" or server=="eb2":
            try:
                if database == "untriggered" and server=="eb0":
                    client = MongoClient(settings.BUFFER_DB_ADDR)
                    retlist = client[settings.BUFFER_DB_REPL][collection].distinct("module")
                elif database=="untriggered" and server=="eb2":
                    client=MongoClient("mongodb://"+settings.MONGO_ADMIN+":"+
                                       settings.MONGO_ADMIN_PASS+"@eb2:27001/admin")
                    retlist = client[settings.BUFFER_DB_REPL][collection].distinct("module")
                else:
                    client = MongoClient(settings.MV_DB_ADDR)
                    retlist = client[settings.MV_BUFFER_REPL][collection].distinct("module")
                #db = client[database]
                            
                return HttpResponse(dumps(retlist),
                            content_type='application/json')
            except:
                print("Can't connect to server")
                return HttpResponse([], content_type="application/json")
        try:
            client = MongoClient(server)
        except:
            print("Can't connect to server")
            return HttpResponse([], content_type="application/json")
        if database in client.database_names() and collection in client[database].collection_names():
            retlist = client[database][collection].find().limit(100).distinct("module")
            client.close()
            return HttpResponse(dumps(retlist),
                                content_type='application/json')
        client.close()
    
    return HttpResponse([], content_type="application/json")

@login_required
def getChannels(request):

    
    if request.method == 'GET' and 'server' in request.GET and 'database' in request.GET and 'collection' in request.GET and 'module' in request.GET:
        server = request.GET['server']
        database = request.GET['database']
        collection = request.GET['collection']
        module = int(request.GET['module'])
        
        if server == "eb0" or server=="eb2":
            try:
                if database == "untriggered" and server=="eb0":
                    client = MongoClient(settings.BUFFER_DB_ADDR)
                    retlist = client[settings.BUFFER_DB_REPL][collection].find(
                        {"module":module}).limit(30).distinct("channel")
                elif database == "untriggered" and server=="eb2":
                    client= MongoClient("mongodb://"+settings.MONGO_ADMIN+":"+
                                        settings.MONGO_ADMIN_PASS+"@eb2:27001/admin")
                    retlist = client["untriggered"][collection].find({"module":module}).limit(30).distinct("channel")

                else:
                    client = MongoClient(settings.MV_DB_ADDR)
                    retlist = client[settings.MV_BUFFER_REPL][collection].find(
                        {"module":module}).limit(30).distinct("channel")
                #db = client[database]                
                return HttpResponse(dumps(retlist),
                                    content_type='application/json')
            except:
                print("Can't connect to server")
                return HttpResponse([], content_type="application/json")

        try:
            client = MongoClient(server)
        except:
            print("Can't connect to server")
            return HttpResponse([], content_type="application/json")
        
        if database in client.database_names() and collection in client[database].collection_names():              
            retlist = client[database][collection].find({"module":module}).limit(100).distinct("channel")
            client.close()
            return HttpResponse(dumps(retlist),
                            content_type='application/json')
        #client.close()
    
    return HttpResponse([], content_type="application/json")

@login_required
def getOccurrences(request):
    
    if request.method == 'GET' and 'server' in request.GET and 'database' in request.GET and 'collection' in request.GET:
        server = request.GET['server']
        database = request.GET['database']
        collection = request.GET['collection']
        
        searchdict = {}
        if "module" in request.GET:
            searchdict["module"] = int(request.GET['module'])
        if "channel" in request.GET:
            searchdict["channel"] = int(request.GET['channel'])

        print("In get occurrences")
        logger.error("In getOccurrences")
        if server == "eb0" or server=="eb2":
            try:
                if database == "untriggered" and server=="eb0":
                    client = MongoClient(settings.BUFFER_DB_ADDR)
                    retlist = list(client[settings.BUFFER_DB_REPL][collection].find(searchdict, {"data":0}).sort("time",-1).limit(500))
                elif database=="untriggered" and server=="eb2":
                    client = MongoClient("mongodb://"+settings.MONGO_ADMIN+":"+
                                         settings.MONGO_ADMIN_PASS+"@eb2:27001/admin")
                    retlist = list(client["untriggered"][collection].find(searchdict, {"data":0}).sort("time",-1).limit(500))

                else:
                    client = MongoClient(settings.MV_DB_ADDR)
                    retlist = list(client[settings.MV_BUFFER_REPL][collection].find(searchdict, {"data":0}).sort("time",-1).limit(500))

                #db = client[database]                
                client.close()
                logger.error(retlist)
                print(retlist)
                return HttpResponse(json_util.dumps(retlist),
                                    content_type='application/json')
            except:
                print("Can't connect to event builder")
                return HttpResponse([], content_type="application/json")

        try:
            client = MongoClient(server)
        except:
            print("Can't connect to server")
            return HttpResponse([], content_type="application/json")
        if database in client.database_names() and collection in client[database].collection_names():
            retlist = list(client[database][collection].find(searchdict, {"data":0}).sort("time",1).limit(50))            
            if len(retlist) > 0:
                print(retlist[0])
            client.close()
            return HttpResponse(json_util.dumps(retlist),
                                content_type='application/json')
        client.close()
    
    return HttpResponse([], content_type="application/json")
