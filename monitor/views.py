from pymongo import MongoClient
from django.contrib.auth.decorators import login_required
from json import dumps, loads
from bson import json_util
from django.shortcuts import HttpResponse, HttpResponsePermanentRedirect
import pickle
from bokeh.plotting import figure
from bokeh.resources import CDN
from bokeh.embed import components
import mpld3
import numpy as np
from bokeh.models import Range1d
from bokeh.io import hplot, vplot, gridplot
import time
import datetime
from django.shortcuts import render
from django.conf import settings
import dateutil

# These options will be set somewhere else later?
online_db_name = settings.MONITOR_DB_NAME
mongodb_address = settings.MONITOR_DB_ADDR
mongodb_port = settings.MONITOR_DB_PORT

# Connect to pymongo
client = MongoClient(mongodb_address, mongodb_port)
db = client[online_db_name]

@login_required
def get_event_as_json(request):

    # Get the doc. If there is no doc return an empty dict
    collection = db['monitor_events']
    try:
        docs = collection.find().sort("_id", -1)[:1]
        doc=docs[0]
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

    return HttpResponse(json_util.dumps(ret_doc), content_type="application/json")

@login_required
def get_event_for_display(request):

    """
    Returns everything needed for 3D display. This is specifically:
        : full waveform
        : For each S1/S2
            : sub-waveform limits (time)
            : hit pattern
        : Hits list per channel/time as bokeh plot
    """

    # Get the doc. If there is no doc return an empty dict
    collection = db['monitor_events']
    try:
        docs = collection.find().sort("_id", -1)[:1]
        doc=docs[0]
    except:
        return HttpResponse({}, content_type="application/json")

    hits_plot = make_bokeh_hits_plot(doc['all_hits'])
    waveform_plot = make_bokeh_waveform_plot(doc['sum_waveforms'])
    hit_displays = make_bokeh_hit_displays(doc['peaks'])
    hits_plot.x_range = waveform_plot.x_range
    # full_plot = vplot(waveform_plot, hits_plot)
    full_plot = gridplot([[waveform_plot], [hits_plot]],
                         toolbar_location="above" )
    d_plot = gridplot( [[hit_displays['s1'], hit_displays['s2']]])


    script, div = components(full_plot)
    dscript, ddiv = components(d_plot)

    trigger_time_ns = (doc['start_time'])
    timestring = time.strftime("%Y/%m/%d, %H:%M:%S", time.gmtime(trigger_time_ns / 10 ** 9))
    print(timestring)
    #ret = {"hits_script": hits_js, "hits_div": hits_div, "waveform_script": waveform_js,
    #      "waveform_div": waveform_div}
    ret = {"script": script, "div": div, 'dscript': dscript, "ddiv": ddiv,
           'run_name': doc['dataset_name'], 'event_number': doc['event_number'], 'event_date': timestring }
    return HttpResponse(dumps(ret), content_type="application/json")


def make_bokeh_hits_plot(hit_list):

    """
    This makes a bokeh plot and returns the div/js elements
    """
    max_size = 100
    min_size = 5
    max_area = max(hit_list, key=lambda x:x['area'])['area']

    x = []
    y = []
    sizes = []
    colors = []
    for hit in hit_list:

        x.append(hit['index_of_maximum'])
        y.append(hit['channel'])
        if hit['is_rejected']:
            colors.append("#EEEEEE")
        else:
            colors.append("red")
        size = max_size*(hit['area']/max_area)
        if size < min_size:
            size = min_size
        sizes.append(size)

    plot = figure(title="Hits per Channel", background_fill=(200, 200, 200, 0.2),
                  width=1100, plot_height=300, logo=None, tools="save,box_zoom,reset",
                  x_axis_label = "Time", y_axis_label = "Channel", title_text_font_size='12pt')
    plot.xaxis.axis_label_text_font_size = "12pt"
    plot.yaxis.axis_label_text_font_size = "12pt"

    plot.scatter(x, y, fill_color=colors, radius=sizes, fill_alpha=0.6, line_color="#AAAAAA", line_alpha=.2, line_width=.1)
    plot.x_range = Range1d(0, 40000)
    plot.min_border_left = 100
    plot.min_border_right = 20

    return plot


def make_bokeh_waveform_plot(waveform_dict):

    """
    """

    plot = figure(title="Waveforms", background_fill=(200, 200, 200, 0.4),
                  width=1100, plot_height=300, logo=None, tools="save,box_zoom,reset",
                  x_axis_label = "Time (samples)", y_axis_label = "Charge", title_text_font_size='12pt')
    plot.xaxis.axis_label_text_font_size = "12pt"
    plot.yaxis.axis_label_text_font_size = "12pt"
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
            thecolor = "#333333"
        plot.line(x, y, color=thecolor, legend=waveform['name'], line_width=1)
        plot.min_border_left = 100

        plot.min_border_right = 20
        idx += 1
    plot.x_range = Range1d(0, 40000)
    # plot.y_range = Range1d(0, 1.1*max_y)

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
                  x_axis_label = "mm", y_axis_label = "mm", title_text_font_size='12pt')

    plot.scatter(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color="#666666")
    plot.xaxis.axis_label_text_font_size = "12pt"
    plot.yaxis.axis_label_text_font_size = "12pt"
    return plot


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
    if plot_doc['type'] != 'h1': # and plot_doc['type'] != 'scatter':
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

    noise_db_name = "noise"
    noise_directory_collection = "directory"
    ndb = client[noise_db_name]
    collection = ndb[noise_directory_collection]

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
                  width=350, plot_height=300, logo=None, tools="save,box_zoom,reset",
                  x_axis_label = "Energy [p.e.]", y_axis_label = "counts", title_text_font_size='12pt')

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


    runs_client = MongoClient(settings.RUNS_DB_ADDR, settings.RUNS_DB_PORT)
    rundb = runs_client[settings.RUNS_DB_NAME]
    run_coll = rundb["runs"]

    start_time = dateutil.parser.parse(request.GET['start'])
    end_time = dateutil.parser.parse(request.GET['end'])
    docs =[]
    try:
        print("STARTEND")
        print(start_time)
        print(end_time)
        docs = run_coll.find({
                "starttimestamp": {"$gt": start_time,
                                   "$lt": end_time  }
                })
    except:
        print("Error finding event")
        return HttpResponse({}, content_type="application/json")
    
    # format and return as http response
    ret = []
    for run in docs:
        endtimestamp = run['starttimestamp']
        if "endtimestamp" in run:
            endtimestamp = run["endtimestamp"]
        ret.append({"title": run['name'],
                    #"start": run['starttimestamp'].isoformat()})#,
                    "start": run['starttimestamp'].strftime("%Y-%m-%dT%H:%M:%S")})
                    #                    "end": endtimestamp})
    print(ret)
    return HttpResponse(dumps(ret), content_type="application/json")
