from pymongo import MongoClient
from django.contrib.auth.decorators import login_required
from json import dumps, loads
from bson import json_util
from django.shortcuts import HttpResponse
import pickle
from bokeh.plotting import figure
from bokeh.resources import CDN
from bokeh.embed import components
import mpld3
import numpy as np
from bokeh.models import Range1d
from bokeh.io import hplot, vplot, gridplot
import time
from django.shortcuts import render


g_pmt_map = {0: {'x': 0, 'y': 0},
             1: {'x': 166.84, 'y': 0.00},     2: {'x': 163.19, 'y': 34.69},
             3: {'x': 152.42, 'y': 67.86},    4: {'x': 134.98, 'y': 98.07},
             5: {'x': 111.64, 'y': 123.99},   6: {'x': 83.42, 'y': 144.49},
             7: {'x': 51.56, 'y': 158.67},    8: {'x': 17.44, 'y': 165.93},
             9: {'x': -17.44, 'y': 165.93},   10: {'x': -51.56, 'y': 158.67},
             11: {'x': -83.42, 'y': 144.49},  12: {'x': -111.64, 'y': 123.99},
             13: {'x': -134.98, 'y': 98.07},  14: {'x': -152.42, 'y': 67.86},
             15: {'x': -163.19, 'y': 34.69},  16: {'x': -166.84, 'y': 0.00},
             17: {'x': -163.19, 'y': -34.69}, 18: {'x': -152.42, 'y': -67.86},
             19: {'x': -134.98, 'y': -98.07}, 20: {'x': -111.64, 'y': -123.99},
             21: {'x': -83.42, 'y': -144.49}, 22: {'x': -51.56, 'y': -158.67},
             23: {'x': -17.44, 'y': -165.93}, 24: {'x': 17.44, 'y': -165.93},
             25: {'x': 51.56, 'y': -158.67},  26: {'x': 83.42, 'y': -144.49},
             27: {'x': 111.64, 'y': -123.99}, 28: {'x': 134.98, 'y': -98.07},
             29: {'x': 152.42, 'y': -67.86},  30: {'x': 163.19, 'y': -34.69},
             31: {'x': 136.53, 'y': 0.00},    32: {'x': 131.88, 'y': 35.34},
             33: {'x': 118.24, 'y': 68.27},   34: {'x': 96.54, 'y': 96.54},
             35: {'x': 68.27, 'y': 118.24},   36: {'x': 35.34, 'y': 131.88},
             37: {'x': 0.00, 'y': 136.53},    38: {'x': -35.34, 'y': 131.88},
             39: {'x': -68.27, 'y': 118.24},  40: {'x': -96.54, 'y': 96.54},
             41: {'x': -118.24, 'y': 68.27},  42: {'x': -131.88, 'y': 35.34},
             43: {'x': -136.53, 'y': 0.00},   44: {'x': -131.88, 'y': -35.34},
             45: {'x': -118.24, 'y': -68.27}, 46: {'x': -96.54, 'y': -96.54},
             47: {'x': -68.27, 'y': -118.24}, 48: {'x': -35.34, 'y': -131.88},
             49: {'x': -0.00, 'y': -136.53},  50: {'x': 35.34, 'y': -131.88},
             51: {'x': 68.27, 'y': -118.24},  52: {'x': 96.54, 'y': -96.54},
             53: {'x': 118.24, 'y': -68.27},  54: {'x': 131.88, 'y': -35.34},
             55: {'x': 106.20, 'y': 0.00},    56: {'x': 101.00, 'y': 32.82},
             57: {'x': 85.92, 'y': 62.42},    58: {'x': 62.42, 'y': 85.92},
             59: {'x': 32.82, 'y': 101.00},   60: {'x': 0.00, 'y': 106.20},
             61: {'x': -32.82, 'y': 101.00},  62: {'x': -62.42, 'y': 85.92},
             63: {'x': -85.92, 'y': 62.42},   64: {'x': -101.00, 'y': 32.82},
             65: {'x': -106.20, 'y': 0.00},   66: {'x': -101.00, 'y': -32.82},
             67: {'x': -85.92, 'y': -62.42},  68: {'x': -62.42, 'y': -85.92},
             69: {'x': -32.82, 'y': -101.00}, 70: {'x': -0.00, 'y': -106.20},
             71: {'x': 32.82, 'y': -101.00},  72: {'x': 62.42, 'y': -85.92},
             73: {'x': 85.92, 'y': -62.42},   74: {'x': 101.00, 'y': -32.82},
             75: {'x': 75.87, 'y': 0.00},     76: {'x': 68.76, 'y': 32.06},
             77: {'x': 47.75, 'y': 58.96},    78: {'x': 17.07, 'y': 73.93},
             79: {'x': -15.77, 'y': 74.21},   80: {'x': -46.71, 'y': 59.79},
             81: {'x': -68.19, 'y': 33.26},   82: {'x': -75.87, 'y': 0.00},
             83: {'x': -68.76, 'y': -32.06},  84: {'x': -47.75, 'y': -58.96},
             85: {'x': -17.07, 'y': -73.93},  86: {'x': 15.77, 'y': -74.21},
             87: {'x': 46.71, 'y': -59.79},   88: {'x': 68.19, 'y': -33.26},
             89: {'x': 45.00, 'y': 0.00},     90: {'x': 30.00, 'y': 30.00},
             91: {'x': -0.00, 'y': 45.00},    92: {'x': -30.00, 'y': 30.00},
             93: {'x': -45.00, 'y': 0.00},    94: {'x': -30.00, 'y': -30.00},
             95: {'x': -0.00, 'y': -45.00},   96: {'x': 30.00, 'y': -30.00},
             97: {'x': 15.00, 'y': 0.00},     98: {'x': -15.00, 'y': 0.00},
             99: {'x': -41.15, 'y': 123.44},  100: {'x': -13.71, 'y': 123.44},
             101: {'x': 13.71, 'y': 123.44},  102: {'x': 41.15, 'y': 123.44},
             103: {'x': -82.29, 'y': 96.00},  104: {'x': -54.86, 'y': 96.00},
             105: {'x': -27.43, 'y': 96.00},  106: {'x': 0.00, 'y': 96.00},
             107: {'x': 27.43, 'y': 96.00},   108: {'x': 54.86, 'y': 96.00},
             109: {'x': 82.29, 'y': 96.00},   110: {'x': -109.72, 'y': 68.58},
             111: {'x': -82.29, 'y': 68.58},  112: {'x': -54.86, 'y': 68.58},
             113: {'x': -27.43, 'y': 68.58},  114: {'x': 0.00, 'y': 68.58},
             115: {'x': 27.43, 'y': 68.58},   116: {'x': 54.86, 'y': 68.58},
             117: {'x': 82.29, 'y': 68.58},   118: {'x': 109.72, 'y': 68.58},
             119: {'x': -123.44, 'y': 41.15}, 120: {'x': -96.00, 'y': 41.15},
             121: {'x': -68.58, 'y': 41.15},  122: {'x': -41.15, 'y': 41.15},
             123: {'x': -13.71, 'y': 41.15},  124: {'x': 13.71, 'y': 41.15},
             125: {'x': 41.15, 'y': 41.15},   126: {'x': 68.58, 'y': 41.15},
             127: {'x': 96.00, 'y': 41.15},   128: {'x': 123.44, 'y': 41.15},
             129: {'x': -123.44, 'y': 13.71}, 130: {'x': -96.00, 'y': 13.71},
             131: {'x': -68.58, 'y': 13.71},  132: {'x': -41.15, 'y': 13.71},
             133: {'x': -13.71, 'y': 13.71},  134: {'x': 13.71, 'y': 13.71},
             135: {'x': 41.15, 'y': 13.71},   136: {'x': 68.58, 'y': 13.71},
             137: {'x': 96.00, 'y': 13.71},   138: {'x': 123.44, 'y': 13.71},
             139: {'x': -123.44, 'y': -13.71}, 140: {'x': -96.00, 'y': -13.71},
             141: {'x': -68.58, 'y': -13.71}, 142: {'x': -41.15, 'y': -13.71},
             143: {'x': -13.71, 'y': -13.71}, 144: {'x': 13.71, 'y': -13.71},
             145: {'x': 41.15, 'y': -13.71},  146: {'x': 68.58, 'y': -13.71},
             147: {'x': 96.00, 'y': -13.71},  148: {'x': 123.44, 'y': -13.71},
             149: {'x': -123.44, 'y': -41.15}, 150: {'x': -96.00, 'y': -41.15},
             151: {'x': -68.58, 'y': -41.15}, 152: {'x': -41.15, 'y': -41.15},
             153: {'x': -13.71, 'y': -41.15}, 154: {'x': 13.71, 'y': -41.15},
             155: {'x': 41.15, 'y': -41.15},  156: {'x': 68.58, 'y': -41.15},
             157: {'x': 96.00, 'y': -41.15},  158: {'x': 123.44, 'y': -41.15},
             159: {'x': -109.72, 'y': -68.58}, 160: {'x': -82.29, 'y': -68.58},
             161: {'x': -54.86, 'y': -68.58}, 162: {'x': -27.43, 'y': -68.58},
             163: {'x': 0.00, 'y': -68.58},   164: {'x': 27.43, 'y': -68.58},
             165: {'x': 54.86, 'y': -68.58},  166: {'x': 82.29, 'y': -68.58},
             167: {'x': 109.72, 'y': -68.58}, 168: {'x': -82.29, 'y': -96.00},
             169: {'x': -54.86, 'y': -96.00}, 170: {'x': -27.43, 'y': -96.00},
             171: {'x': 0.00, 'y': -96.00},   172: {'x': 27.43, 'y': -96.00},
             173: {'x': 54.86, 'y': -96.00},  174: {'x': 82.29, 'y': -96.00},
             175: {'x': -41.15, 'y': -123.44}, 176: {'x': -13.71, 'y': -123.44},
             177: {'x': 13.71, 'y': -123.44}, 178: {'x': 41.15, 'y': -123.44},
             179: {'x': 197.15, 'y': 0.00},   180: {'x': 193.53, 'y': 37.62},
             181: {'x': 182.79, 'y': 73.85},  182: {'x': 165.34, 'y': 107.38},
             183: {'x': 139.41, 'y': 139.41}, 184: {'x': 110.25, 'y': 163.44},
             185: {'x': 77.03, 'y': 181.48},  186: {'x': 40.99, 'y': 192.84},
             187: {'x': 0.00, 'y': 197.15},   188: {'x': -37.62, 'y': 193.53},
             189: {'x': -73.85, 'y': 182.79}, 190: {'x': -107.38, 'y': 165.34},
             191: {'x': -139.41, 'y': 139.41}, 192: {'x': -163.44, 'y': 110.25},
             193: {'x': -181.48, 'y': 77.03}, 194: {'x': -192.84, 'y': 40.99},
             195: {'x': -197.15, 'y': 0.00},  196: {'x': -193.53, 'y': -37.62},
             197: {'x': -182.79, 'y': -73.85}, 198: {'x': -165.34, 'y': -107.38},
             199: {'x': -139.41, 'y': -139.41}, 200: {'x': -110.25, 'y': -163.44},
             201: {'x': -77.03, 'y': -181.48}, 202: {'x': -40.99, 'y': -192.84},
             203: {'x': -0.00, 'y': -197.15}, 204: {'x': 37.62, 'y': -193.53},
             205: {'x': 73.85, 'y': -182.79}, 206: {'x': 107.38, 'y': -165.34},
             207: {'x': 139.41, 'y': -139.41}, 208: {'x': 163.44, 'y': -110.25},
             209: {'x': 181.48, 'y': -77.03}, 210: {'x': 192.84, 'y': -40.99},
             211: {'x': -197.15, 'y': 0.00}, 212: {'x': -193.53, 'y': 37.62},
             213: {'x': -182.79, 'y': 73.85}, 214: {'x': -165.34, 'y': 107.38},
             215: {'x': -139.41, 'y': 139.41}, 216: {'x': -110.25, 'y': 163.44},
             217: {'x': -77.03, 'y': 181.48}, 218: {'x': -40.99, 'y': 192.84},
             219: {'x': -0.00, 'y': 197.15},  220: {'x': 37.62, 'y': 193.53},
             221: {'x': 73.85, 'y': 182.79},  222: {'x': 107.38, 'y': 165.34},
             223: {'x': 139.41, 'y': 139.41}, 224: {'x': 163.44, 'y': 110.25},
             225: {'x': 181.48, 'y': 77.03},  226: {'x': 192.84, 'y': 40.99},
             227: {'x': 197.15, 'y': 0.00},   228: {'x': 193.53, 'y': -37.62},
             229: {'x': 182.79, 'y': -73.85}, 230: {'x': 165.34, 'y': -107.38},
             231: {'x': 139.41, 'y': -139.41}, 232: {'x': 110.25, 'y': -163.44},
             233: {'x': 77.03, 'y': -181.48}, 234: {'x': 40.99, 'y': -192.84},
             235: {'x': 0.00, 'y': -197.15}, 236: {'x': -37.62, 'y': -193.53},
             237: {'x': -73.85, 'y': -182.79}, 238: {'x': -107.38, 'y': -165.34},
             239: {'x': -139.41, 'y': -139.41}, 240: {'x': -163.44, 'y': -110.25},
             241: {'x': -181.48, 'y': -77.03}, 242: {'x': -192.84, 'y': -40.99},
             }

# These options will be set somewhere else later?
online_db_name = "online"
runs_db_collection = "runs"
mongodb_address = "localhost"
mongodb_port = 27017

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

    max_entries = 1000
    run_list = collection.find().sort("_id", -1)[:max_entries]
    return render(request, 'monitor/noise.html', {"run_list": run_list})


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


    collection = ndb[collection_name]

    # Get the doc. If there is no doc return an empty dict
    try:
        docs = collection.find().sort("_id", 1)
    except:
        return render(request, "monitor/event_detail.html", {})

    plots=[]
    for doc in docs:
        plot = figure(title=doc['name'], background_fill=(200, 200, 200, 0.3),
                  width=250, plot_height=200, logo=None, tools="save,box_zoom,reset",
                  x_axis_label = "Energy [p.e.]", y_axis_label = "counts", title_text_font_size='12pt')

        dat = doc['data']
        dat.pop()
        trim = np.trim_zeros(dat, trim='b')
        edges = []
        for i in range(0, len(trim)+1):
            edges.append(i)

        plot.quad(top=trim, bottom=0, left=edges[:-1], right=edges[1:], fill_color="#036564", line_color="#033649")
        plot.legend.orientation = "top_left"
        plots.append(plot)

    splitlist = list(chunks(plots,3))
    moreplots = []
    for chunk in splitlist:
        if(len(chunk)==3):
            theplot = hplot(chunk[0], chunk[1], chunk[2])
        elif(len(chunk)==2):
            theplot = hplot(chunk[0], chunk[1])
        else:
            theplot = chunk[0]
        script, div = components(theplot)
        moreplots.append({"script": script, "div": div})

    #full_plot = gridplot(list(chunks(plots,4)))
    #script, div = components(full_plot)

    #ret = {"script": script, "div": div, 'run_name': doc['run'] }
    ret = {"plots": moreplots, 'run_name': doc['run']}
    return render(request, "monitor/event_detail.html", ret)

