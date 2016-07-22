from django.db import models
import pymongo
from django.conf import settings
from tastypie import fields
from tastypie.authorization import ReadOnlyAuthorization
from tastypie.resources import Resource
from tastypie.bundle import Bundle
from tastypie.authentication import ApiKeyAuthentication
from tastypie.throttle import CacheThrottle
import logging
logger = logging.getLogger('emo')


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
