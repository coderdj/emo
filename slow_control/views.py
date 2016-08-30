from django.shortcuts import render
from django.http import HttpResponsePermanentRedirect, HttpResponse
from pymongo import MongoClient
from django.conf import settings
from django.contrib.auth.decorators import login_required
from bson.json_util import dumps
import datetime
import logging
import math
import pytz
logger = logging.getLogger('emo')

# This should later go in the DB itself
descriptions = {
    "pfeiffer_id": "Pump timestamp output",
    "cryostat_vacuum": "Vacuum reading in cryostat",
    "p2": "Pressure of xenon in the recuperating system (atm)",
    "omega_id": "Omega timestamp output",
    "p1": "Pressure of xenon gas inside the  detector (atm)",
    "lakeshore_id": "Lakeshore timestamp output",
    "cold_finger": " The temperature of the coldfinger, which is the temperature on the heatlink between the PTR and the cell",
    "heater": "Power needed to keep the cell at a constant temperature, percentage of max voltage",
    "baking_pt100_3": "Cooling water temperature for He compressor",
}

PASSWORD = "slowControlSuperSecretPasswordOhYeah!"
scc = MongoClient('mongodb://slow_control_extractor:%s@'
                'zenigata.uchicago.edu:27020/slow_control' % PASSWORD)
scd = scc['slow_control']
c = MongoClient(settings.SC_DB_ADDR)
d = c[settings.SC_DB_NAME]

#BUTTON
import requests
@login_required
def button_click(request):
    web = requests.get('https://172.16.2.105:4040/WebService.asmx/GetSCLastValue?name=XE1T.CTPC.BOARD14.CHAN000.VMON;&username=slowcontrolwebserver;&api_key=ssn1sslkvdhittoywjk88w9cmbxf4fmprn68r8hm', verify=False);
    #web = requests.get('https://172.16.2.105:4040/WebService.asmx/GetSCLastValue?name=XE1T.CRY_TIC111_TE111A_TCLDFNGA_AI.PI\&username=slowcontrolwebserver\&api_key=ssn1sslkvdhittoywjk88w9cmbxf4fmprn68r8hm', verify=False)
    return HttpResponse(dumps(web.content), content_type="application/json")

@login_required
def get_water_level(request):
    sccol = scd['measurements']
    doc = sccol.find({"name": "XE1T.WLP_INDLEVL_H20_1.PI"}).sort("_id", -1).limit(1)
    if doc.count() == 0:
        return HttpResponse(dumps({"value": -1}), content_type="application/json")
    return HttpResponse(dumps({"value":doc[0]['value']}), content_type="application/json")

@login_required
def get_sc_info(request):

    sccol = scd['measurements']
    pmts_on = 0
    pmts_tot = 0
    meas_date = None

    cathode = 0.
    catcur = (sccol.find({"name": "XE1T.GEN_HEINZVMON.PI"}).sort("_id", -1).limit(1))
    if catcur.count()>0:
        cathode = catcur[0]['value']
        if meas_date == None or catcur[0]['request_time'] < meas_date:
            meas_date = catcur[0]['request_time']


    cursor = (sccol.find({"name": {"$regex": "XE1T.CTPC.BOARD.*VMON"}}).
              sort("_id", -1).limit(1000))
    
    # Need list we can cycle multiple times
    sensors = {}
    anode = -1.
    for doc in cursor:
        if doc['name'] not in sensors:
            sensors[doc['name']] = {'value': doc['value'], 
                                    'request_time': doc['request_time']}
        if doc['name'] == "XE1T.CTPC.BOARD14.CHAN000.VMON" and anode<0:
            anode = doc['value']
    
    pmts_found = [0]*254
    for pmt in settings.PMT_MAPPING:
        sboard = int(pmt['high_voltage']['connector'].split('.')[0])
        sboard += 3
        board = str(sboard)
        channel = (pmt['high_voltage']['connector'].split('.')[1])
        
        sensor = ('XE1T.CTPC.BOARD'+board.zfill(2)+".CHAN"+
                  channel.zfill(3)+".VMON")
                
        if sensor in sensors.keys():
            sen = sensors[sensor]
        
            if sen['value'] > 500. and pmts_found[pmt['pmt_position']]==0:
                pmts_on +=1
                pmts_found[pmt['pmt_position']] = 1.
            
                if meas_date == None or sen['request_time'] < meas_date:
                    meas_date = sen['request_time']
            pmts_tot += 1
    
    pmts_off = []
    for i in range(0, 254):
        if pmts_found[i] == 0:
            pmts_off.append(i)
    ret = {"pmts": {"on": pmts_on, "tot": pmts_tot, "date": meas_date},
           "anode": anode, "cathode": cathode, "pmts_off": pmts_off}
    
    tz_stupid_slowcontrol = pytz.utc#pytz.timezone("Europe/Zurich")
    meas_utc = tz_stupid_slowcontrol.localize(meas_date)
    meas_utc = meas_utc.astimezone(pytz.utc)
    ret['date'] = meas_utc
    now_utc = pytz.utc.localize(datetime.datetime.now())
    ret['now'] = now_utc
    ret['staleness'] = math.floor((now_utc - meas_utc).seconds/60)
    return HttpResponse(dumps(ret), content_type="application/json")

@login_required
def get_sensor_newest(request):
    
    detector = 'xenon100'
    if request.method=="GET" and "detector" in request.GET:
        detector = request.GET['detector']        
    mongo_collection = d['slow_control']
    #mongo_collection = d['measurements']

    cur = mongo_collection.find({"detector": detector}, sort= [ ("_id", -1) ], limit=1)

    if cur.count() >= 1:
        newest = cur[0]
        #newest['key'] = descriptions
        retdict = { "time": newest['time'], 'categories': {}}
        for sensor in newest['sensors']:
            if sensor['category'][:3] == "PMT":
                continue
            if sensor['category'] not in retdict['categories'].keys():
                retdict['categories'][sensor['category']] = []
            retdict['categories'][sensor['category']].append(sensor)

        return HttpResponse(dumps(retdict), content_type="application/json")
    return HttpResponse("")

@login_required
def get_hv_newest(request):
    detector = 'xenon1t'
    #mongo_collection = d['slow_control']
    mongo_collection = d['measurements']
    cur = mongo_collection.find({"detector": detector}, sort= [ ("_id", -1) ], limit=1)              
    channels = []
    time=None    
    if cur.count()>=1:
        doc = cur[0]
        time=doc['time']
        for sensor in doc['sensors']:
            if sensor['category'] == "PMT voltage":
                module = int(sensor['name'][15:-13])
                channel = int(sensor['name'][22:-5])
                #logger.error(module)
                #logger.error(channel)
                value = sensor['value']
                inserted=False

                for i in range(0, len(channels)):
                    if channels[i]['module']<module:
                        continue
                    elif channels[i]['module'] == module and channels[i]['channel']<channel:
                        continue
                    elif (channels[i]['module'] > module or (channels[i]['module']==module and channels[i]['channel'] > channel)):
                        #logger.error(str(i) + " " + str(len(channels)))
                        channels.insert(i, {"module":module,"channel":channel,"voltage":value, "pmt": get_pmt_id(module,channel), "status": "unknown"})                        
                        inserted=True
                        break
                if not inserted:
                    pmt = get_pmt_id(module, channel)
                    channels.append({"module":module, "channel":channel, 
                                     "voltage":value, "pmt": pmt, "status": "unknown"})
                    
        for sensor in doc['sensors']:
            if sensor['category']=='PMT current':
                module = int(sensor['name'][15:-13])
                channel = int(sensor['name'][22:-5])
                value = sensor['value']
                for i in range(0, len(channels)):
                    if channels[i]['module']==module and channels[i]['channel']==channel:
                        channels[i]['current']=value

    # Make google chart thing
    gchart= [["ID", "X", "Y", "voltage", "current"]]
    for i in channels:
        if i['pmt']>=0 and i['pmt']<248:
            row=[str(i['pmt']), get_pmt_x(i['pmt']), get_pmt_y(i['pmt']), i['voltage'], i['current']]
            for entry in gchart:
                if entry[0] == "ID":
                    continue
                if int(entry[0]) < int(row[0]):
                    break
            gchart.append(row)
                     
    return HttpResponse(dumps({"gchart": gchart, "HV":channels, "time":time}), content_type="application/json")

@login_required 
def get_hv_history(request):
    max_points = 500
    mongo_collection = d['slow_control']
    #mongo_collection = d['measurements']

    if request.method=="GET" and 'module' in request.GET and 'channel' in request.GET:
        module = request.GET['module']
        channel = request.GET['channel']
        
        stub = ('XE1T_CTPC_BOARD' + module.rjust(2, '0') + "_CHAN" 
                + channel.rjust(3,'0'))

        v_var = stub + "_VMON"
        i_var = stub + "_IMON"
        
        cursor = mongo_collection.find({"detector": "xenon1t"},
                                       sort= [ ("_id", -1) ], limit=max_points)
        retvals = {"time":[], "voltage": [], "current": []}
        for doc in cursor:
            time = ((doc['time']-datetime.datetime(1970,1,1))/datetime.timedelta(seconds=1)*1000)
            for sensor in doc['sensors']:
                if sensor['name'] == v_var:
                    retvals['voltage'].append([time, sensor['value']])
                elif sensor['name'] == i_var:
                    retvals['current'].append([time, sensor['value']])
        return HttpResponse(dumps({"points": retvals}), content_type="application/json")

    return HttpResponse({"points":{}}, content_type="application/json")
        
@login_required
def get_sensor_history(request):
    
    max_points = 500
    req_sensor = "" #all
    detector='xenon100'
    # include here some GET for filtering sensor/number of points    
    if request.method == "GET":
        if 'sensor' in request.GET:
            req_sensor = request.GET['sensor']
        if 'events' in request.GET:
            max_points = int(request.GET['events'])
        if 'detector' in request.GET:
            detector = request.GET['detector']
    mongo_collection = d['slow_control']
    #mongo_collection = d['measurements']
    cursor = mongo_collection.find({"detector": detector}, 
                                   sort= [ ("_id", -1) ], limit=max_points)
    retdoc = {}
    for doc in cursor:
        for i in range(0, len(doc['sensors'])):
            sensor = doc['sensors'][i]
            if req_sensor != "" and req_sensor!=sensor['name']:
                continue
            if sensor['name'] in retdoc.keys():
                retdoc[sensor['name']].append([(doc['time']-datetime.datetime(1970,1,1))/datetime.timedelta(seconds=1)*1000, sensor['value']])
            else:
                retdoc[sensor['name']] = [[ (doc['time']-datetime.datetime(1970,1,1))/datetime.timedelta(seconds=1)*1000, sensor['value'] ]]
    reversed_doc = {}
    for sensor in retdoc.keys():
        reversed_doc[sensor] = list(reversed(retdoc[sensor]))
    return HttpResponse(dumps(reversed_doc), content_type="application/json")

def get_pmt_id(hv_module, hv_channel):
    for i in range(0, len(settings.PMT_MAPPING)):
        fmodchan = float(settings.PMT_MAPPING[i]['high_voltage']['connector'])
        smodchan = '%.2f' % fmodchan
        modchan = smodchan.split('.') 

        module = int(modchan[0])+3
        channel = int(modchan[1])
        if module == hv_module and channel == hv_channel:
            return settings.PMT_MAPPING[i]['pmt_position']
    return -1

def get_pmt_x(pmt):
    if pmt>=0 and pmt<len(settings.PMT_MAPPING):
        return settings.PMT_MAPPING[pmt]['position']['x']
    return -100
def get_pmt_y(pmt):
    if pmt>=0 and pmt<len(settings.PMT_MAPPING):
        if pmt<=126:
            return settings.PMT_MAPPING[pmt]['position']['y']
        return settings.PMT_MAPPING[pmt]['position']['y']-100
    return -100
