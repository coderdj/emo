from django.db import models
import pymongo
from django.conf import settings
from tastypie import fields
from tastypie.authorization import ReadOnlyAuthorization
from tastypie.resources import Resource
from tastypie.bundle import Bundle
from tastypie.authentication import ApiKeyAuthentication
from tastypie.throttle import CacheThrottle
import requests
import json
from bson.json_util import dumps

import logging
logger = logging.getLogger('emo')

import datetime
epoch = datetime.datetime.utcfromtimestamp(0)


# Basic wrapper class for tastypie
class DAQStatus(object):

    def __init__(self, initial=None):
        self.__dict__['_data'] = {}
    
        if hasattr(initial, 'items'):
            self.__dict__['_data'] = initial
            
    def __getattr__(self, name):
        return self._data.get(name, None)

    def __setattr__(self, name, value):
        self.__dict__['_data'][name] = value

    def to_dict(self):
        return self._data

class scvar(object):

    def __init__(self, initial=None):
        self.__dict__['_data'] = {}

        if hasattr(initial, 'items'):
            self.__dict__['_data'] = initial

    def __getattr__(self, name):
        return self._data.get(name, None)

    def __setattr__(self, name, value):
        self.__dict__['_data'][name] = value

    def to_dict(self):
        return self._data

class rundoc(object):
        
    def __init__(self, initial=None):
        self.__dict__['_data'] = {}

        if hasattr(initial, 'items'):
            self.__dict__['_data'] = initial

    def __getattr__(self, name):
        return self._data.get(name, None)

    def __setattr__(self, name, value):
        self.__dict__['_data'][name] = value

    def to_dict(self):
        return self._data


# The actual API resource
class StatusResource(Resource):

    detector = fields.CharField(attribute="detector")
    node = fields.CharField(attribute="node")
    datarate = fields.FloatField(attribute="datarate")
    cpu = fields.FloatField(attribute="cpu")
    ram = fields.FloatField(attribute="ram")
    mode = fields.CharField(attribute="mode")
    user = fields.CharField(attribute="user")
    start = fields.DateTimeField()
    bltrate = fields.IntegerField(attribute="bltrate")
    state = fields.CharField(attribute="state")
    
    class Meta:
        resource_name = 'daq_status'
        object_class = DAQStatus
        authorization = ReadOnlyAuthorization()
        authentication = ApiKeyAuthentication()
        throttle = CacheThrottle(throttle_at=10, timeframe=60)

    def _db(self):
        try:
            return (pymongo.MongoClient(settings.MONITOR_DB_ADDR)
                    [settings.MONITOR_DB_NAME])
        except:
            return None
    
    # Needed by tastypie
    def detail_uri_kwargs(self, bundle_or_obj):
        kwargs = {}
        if isinstance(bundle_or_obj, Bundle):
            kwargs['pk'] = bundle_or_obj.obj.detector
        else:
            kwargs['pk'] = bundle_or_obj.detector

        return kwargs

    def get_object_list(self, request):
        self.throttle_check(request)
        self.log_throttled_access(request)
        det = 'tpc'
        if 'det' in request.GET:
            det = request.GET['det']
        return [self._create_obj(det)]
            
    def obj_get_list(self, bundle, **kwargs):
        return self.get_object_list(bundle.request)
        
    def obj_get(self, bundle, **kwargs):
        self.throttle_check(bundle.request)
        self.log_throttled_access(bundle.request)
        det = 'tpc'
        if 'det' in bundle.request.GET:
            det = bundle.request.GET['det']
        if 'pk' in kwargs:
            det = kwargs['pk']
        return self._create_obj(det)
        
    def _create_obj(self, det):
        doc = self._db()['daq_status'].find({"detector": 
                                             det}).sort("_id", -1).limit(1)[0]
        ret = {
            "detector": doc["detector"],            
            "node": "all",
            "state": doc['state'],
            "user": doc['startedBy'],
            "start": doc['startTime'],
            "bltrate": 0,
            "cpu": 0, 
            "ram": 0,
            "run": doc['currentRun'],
            "datarate": 0,
            "mode": doc['mode']
        }

        nodes = ["reader5"]
        if det == "tpc":
            nodes = ["reader0", "reader1", "reader2", "reader3", "reader4", 
                    "reader6", "reader7"]
        for node in nodes:
            cursor = self._db()['daq_rates'].find({"node":
                                                 node}).sort("_id", -1).limit(1)
            if cursor.count() > 0:
                ret['datarate'] += cursor[0]['datarate']
                ret['bltrate'] += cursor[0]['bltrate']
                ret['cpu'] += cursor[0]['cpu']
                ret['ram'] += cursor[0]['ram']
        ret_obj = DAQStatus(initial=ret)
        return ret_obj


    def obj_create(self, bundle, **kwargs):
        pass

    def obj_update(self, bundle, **kwargs):
        pass

    def obj_delete_list(self, bundle, **kwargs):
        pass

    def obj_delete(self, bundle, **kwargs):
        pass

    def rollback(self, bundles):
        pass


# The actual API resource                                                                                                                                                     
class SlowControlResource(Resource):

    kpi = fields.CharField(attribute="kpi")
    #request_time = fields.TimeField(attribute="request_time")
    #start = fields.TimeField(attribute="start")
    #end = fields.TimeFIeld(attribute="end")
    data = fields.ListField(attribute="data")
    #times = fields.ListField(attribute="times")

    class Meta:
        resource_name = 'sc'
        object_class = scvar
        authorization = ReadOnlyAuthorization()
        authentication = ApiKeyAuthentication()
        throttle = CacheThrottle(throttle_at=60, timeframe=60)

    # Needed by tastypie                                                                                                                                                       
    def detail_uri_kwargs(self, bundle_or_obj):
        kwargs = {}
        if isinstance(bundle_or_obj, Bundle):
            kwargs['pk'] = bundle_or_obj.obj.kpi
        else:
            kwargs['pk'] = bundle_or_obj.kpi
        return kwargs

    def get_object_list(self, request):
        self.throttle_check(request)
        self.log_throttled_access(request)

        #if 'kpi' in request.GET:
        #    return [self._create_obj({"kpi": request.GET['kpi']})]
        return scvar(initial={"error": "No key parameter indicator specified. Please define the variable kpi in your request."})

    def obj_get_list(self, bundle, **kwargs):
        return self.get_object_list(bundle.request)

    def obj_get(self, bundle, **kwargs):
        self.throttle_check(bundle.request)
        self.log_throttled_access(bundle.request)        
        req = {}
        if 'pk' in kwargs: 
            #bundle.request.GET:
            req['kpi'] = kwargs['pk']
            #req['kpi'] = bundle.request.GET['kpi']
            s_past = 0
            if 'hours' in bundle.request.GET:
                s_past += int(bundle.request.GET['hours']) * 60 * 60
            if 'minutes' in bundle.request.GET:
                s_past += int(bundle.request.GET['minutes']) * 60
            if 'seconds' in bundle.request.GET:
                s_past += int(bundle.request.GET['seconds'])
            if s_past != 0:
                req['start'] = (datetime.datetime.utcnow()-epoch).total_seconds() - s_past
            if 'start' in bundle.request.GET:
                req['start'] = bundle.request.GET['start']
            if 'end' in bundle.request.GET:
                req['end'] = bundle.request.GET['end']

            req['measured'] = False
            if 'measured' in bundle.request.GET:
                req['measured'] = bool(bundle.request.GET['measured'])
                if 'start' not in req:
                    req['start'] = 12*60*60*60 # 12 hour

            return self._create_obj(req)
        return scvar(initial={"error": "No key parameter indicator specified. Please define the variable kpi in your request."})


    def _create_obj(self, req):

        # Function: 
        get_base = "https://172.16.2.105:4040/WebService.asmx"
        if not req['measured']:
            get_base += "/GetSCLastValue?"
        else:
            get_base += "/getLastMeasuredValue?";

        getreq = get_base + "name="+req['kpi']
        getreq += "&username=" + settings.SC_API_USERNAME
        getreq += "&api_key=" + settings.SC_API_KEY
        if 'start' in req:
            getreq += "&EndDateUnix=" + str(req['start'])
            
        res = requests.get(getreq, verify=False).content
        if res is None:
            return scvar(initial={"data": "No response from server. Check variable syntax.", "kpi": req['kpi']})            
        try:
            response = json.loads(res.decode('utf-8'))
        except:
            console.log("ERROR with json")
        if len(response)==0:
            response = [{"error": "Server provided malformed json"}]

        ret = {}
        ret['kpi'] = req['kpi']

        if 'start' in req:
            ret['start'] = req['start']
        if 'end' in req:
            ret['end'] = req['end']
        ret['data']=response
        
        ret_obj = scvar(initial=ret)
        return ret_obj




    def obj_create(self, bundle, **kwargs):
        pass

    def obj_update(self, bundle, **kwargs):
        pass

    def obj_delete_list(self, bundle, **kwargs):
        pass

    def obj_delete(self, bundle, **kwargs):
        pass

    def rollback(self, bundles):
        pass



# Run 
class RunsResource(Resource):

    number = fields.IntegerField(attribute="number")    

    class Meta:
        resource_name = 'runs'
        object_class = rundoc
        authorization = ReadOnlyAuthorization()
        authentication = ApiKeyAuthentication()
        throttle = CacheThrottle(throttle_at=60, timeframe=60)
        
    def _db(self):
        try:
            return (pymongo.MongoClient(settings.RUNS_DB_ADDR)
                    [settings.RUNS_DB_NAME])
        except:
            return None

    def detail_uri_kwargs(self, bundle_or_obj):
        kwargs = {}
        if isinstance(bundle_or_obj, Bundle):
            kwargs['pk'] = bundle_or_obj.obj.number
        else:
            kwargs['pk'] = bundle_or_obj.number
        return kwargs

    def get_object_list(self, request):
        self.throttle_check(request)
        self.log_throttled_access(request)
        return rundoc(initial={"error": "For now we only support searching for a run by number"})

    def obj_get_list(self, bundle, **kwargs):
        return self.get_object_list(bundle.request)


    def obj_get(self, bundle, **kwargs):
        self.throttle_check(bundle.request)
        self.log_throttled_access(bundle.request)
        req = {}
        if 'pk' in kwargs:
            req['number'] = kwargs['pk']

            return self._create_obj(req)
        return rundoc(initial={"error": "For now we only support searching for a run by number"})

    def _create_obj(self, req):

        doc = self._db()[settings.RUNS_DB_COLLECTION].find_one({"number":
                                                                int(req['number'])})
        if doc is None:
            return {"error": "Couldn't find run with number " + str(req['number']),
                    "number": req['number']
                }

            
        #ret_obj = rundoc(initial=doc)
        #ret_obj['number'] = doc['number']
        return doc


    def obj_create(self, bundle, **kwargs):
        pass

    def obj_update(self, bundle, **kwargs):
        pass

    def obj_delete_list(self, bundle, **kwargs):
        pass

    def obj_delete(self, bundle, **kwargs):
        pass

    def rollback(self, bundles):
        pass
