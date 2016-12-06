from django.db import models
import pymongo
from django.conf import settings
from tastypie import fields
from tastypie.authorization import ReadOnlyAuthorization, DjangoAuthorization, Authorization
from tastypie.resources import Resource
from tastypie.bundle import Bundle
from tastypie.authentication import ApiKeyAuthentication
from tastypie.throttle import CacheThrottle
import requests
import json
import codecs
from bson.json_util import dumps
from bson.objectid import ObjectId

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
    alerts = fields.IntegerField(attribute="alerts")
    
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
        try:
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
                "mode": doc['mode'],
                "alerts": 0
            }
        except:
            ret = {
                "error": "error",
                "datarate": 0,
                "bltrate": 0,
                "cpu": 0,
                "alerts": 0,
                "ram": 0
            }

        # Alerts
        try:
            logcollection = self._db()["log"]
            if logcollection.find({"priority": {"$gt": 2, "$lt": 5}}).count() != 0:
                ret["alerts"] = 1
        except:
            ret['alerts'] = 2

        # This line disables SC alarms!
        #ret['alerts'] = 0

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
                req['start'] = (datetime.datetime.utcnow()-
                                epoch).total_seconds() - s_past
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
    _id = fields.CharField(attribute="_id")
    detector = fields.CharField(attribute="detector")
    name = fields.CharField(attribute="name")
    doc = fields.DictField(attribute="doc")
    class Meta:
        resource_name = 'runs'
        object_class = rundoc
        allowed_methods = ['get', 'post', 'put']
        authorization = Authorization()
        authentication = ApiKeyAuthentication()
        throttle = CacheThrottle(throttle_at=500, timeframe=60)
        
    def _db(self):
        try:
            return (pymongo.MongoClient(settings.RUNS_DB_ADDR)
                    [settings.RUNS_DB_NAME])
        except:
            return None

    def detail_uri_kwargs(self, bundle_or_obj):
        kwargs = {}
        if isinstance(bundle_or_obj, Bundle):
            kwargs['pk'] = bundle_or_obj.obj._id
        else:
            kwargs['pk'] = bundle_or_obj._id
        return kwargs

    def get_object_list(self, request):
        # This will return a stripped down version of the run doc
        # It includes _id, name, number (if applicable), and detector
        self.throttle_check(request)
        self.log_throttled_access(request)

        query = {}
        
        if "query" in request.GET:
            query = json.loads(request.GET['query'])
        if "number" in request.GET:
            query['number'] = int(request.GET['number'])
        if "detector" in request.GET:
            query['detector'] = request.GET['detector']
        if "name" in request.GET:
            query['name'] = request.GET['name']
        if "_id" in request.GET:
            query['_id'] = request.GET['_id']
            
            
        cursor = self._db()[settings.RUNS_DB_COLLECTION].find(query).sort("_id", -1)

        ret = []
        for doc in cursor:
            if 'number' in doc:
                thedoc = {"number": doc['number'] }
            else:
                thedoc = {"number": -1}
            thedoc['name'] = doc['name']
            thedoc['_id'] = doc['_id']
            thedoc['detector'] = doc['detector']
            thedoc['doc'] = doc
            ret.append(rundoc(initial=thedoc))

        return ret

    def obj_get_list(self, bundle, **kwargs):
        return self.get_object_list(bundle.request)


    def obj_get(self, bundle, **kwargs):
        self.throttle_check(bundle.request)
        self.log_throttled_access(bundle.request)
        req = {}
        if 'pk' in kwargs:
            req['_id'] = kwargs['pk']
            return self._create_obj(req)
        return rundoc(initial={"error": "For now we only support searching for a run by number"})

    def _create_obj(self, req):
        
        doc = self._db()[settings.RUNS_DB_COLLECTION].find_one(
            {"_id": 
             ObjectId(req['_id'])})        
        if doc is None:
            return 
        
        ret = {}
        if 'number' in doc:
            ret['number'] = doc['number']
        else:
            ret['number'] = -1
        ret['detector'] = doc['detector']
        ret['_id'] = doc['_id']
        ret['name'] = doc['name']
        ret['doc'] = doc
        ret_obj = rundoc(initial=ret)

        return ret_obj

    def obj_create(self, bundle, **kwargs):        
        return self.obj_update(bundle, kwargs)

    def obj_update(self, bundle, **kwargs):
        self.throttle_check(bundle.request)
        self.log_throttled_access(bundle.request)
        searchDict = {}
        ret = {}

        reader = codecs.getreader("utf-8")        
        request = (json.load(reader(bundle.request)))        
        logger.error(request)
        if 'pk' in kwargs:
            searchDict['_id'] = ObjectId(kwargs['pk'])
        elif 'number' in request:
            searchDict['number'] = int(request['number'])
        elif 'name' in request and 'detector' in request:
            searchDict['name'] = request['name']
            searchDict['detector'] = request['detector']

        updateDict = {}
        # need host, type, status, location and for processed pax_version
        # in call cases we update the doc UNLESS the status is 'removed'
        # in this case we will remove the entry from the doc if there is one
        # matching the rest of the parameters
        # for non-'removed' operations a checksum is also required
        if ( 'status' not in request or 'host' not in request 
             or 'location' not in request or 'type' not in request ):
            logger.error("Bad request, required variables not found")
            doc = self._default(
                "ERROR", 
                "Bad request. Require status, host, location, and type"
            )
            bundle.obj = rundoc(initial=doc)
            bundle = self.full_hydrate(bundle)
            return bundle.obj

        updateDict = request

        # For removal
        if request['status'] == 'remove':
            updateDict.pop('status')
            returnvalue = self._db()[settings.RUNS_DB_COLLECTION].update_one(
                searchDict,
                {"$pull": 
                 { "data": updateDict }})
            doc = self._default(
                "Success",
                "Document updated",
                returnvalue
            )
            bundle.obj = rundoc(initial=doc)
            bundle = self.full_hydrate(bundle)
            return bundle.obj

        elif request['status'] == 'processed':
            if 'pax_version' not in request:
                return {"number": doc['number'], 
                        "ERROR": "pax_version must be provided for processed data"}
            updateDict['pax_version'] = request['pax_version']

        # Status needed for new entry
        updateDict['status'] = request['status']
        updateDict['creation_time'] = datetime.datetime.utcnow(),                     

        # Now add a new entry
        res = self._db()[settings.RUNS_DB_COLLECTION].update_one(
            searchDict, 
            {"$push": {"data": updateDict}})
        doc = self._default(
            "Success",
            "Document updated",
            res
        )
        bundle.obj = rundoc(initial=doc)
        bundle = self.full_hydrate(bundle)        

        return rundoc(initial=doc)
        
    def _default(self, message, longer, return_value):
        doc = {
            "number": -1,
            "_id": -1,
            "detector": "ret",
            "name": message,
            "doc": {
                "message": longer,
                "success": message,
                "ret": return_value
                }
        }
        return doc

    def obj_delete_list(self, bundle, **kwargs):
        pass

    def obj_delete(self, bundle, **kwargs):
        pass

    def rollback(self, bundles):
        pass



# Run
class QualityResource(Resource):
    number = fields.IntegerField(attribute="number")
    _id = fields.CharField(attribute="_id")
    detector = fields.CharField(attribute="detector")
    name = fields.CharField(attribute="name")
    doc = fields.DictField(attribute="doc")
    class Meta:
        resource_name = 'quality'
        object_class = rundoc
        allowed_methods = ['get', 'post', 'put']
        authorization = Authorization()
        authentication = ApiKeyAuthentication()
        throttle = CacheThrottle(throttle_at=500, timeframe=60)

    def _db(self):
        try:
            return (pymongo.MongoClient(settings.RUNS_DB_ADDR)
                                [settings.RUNS_DB_NAME])
        except:
            return None
            
    def detail_uri_kwargs(self, bundle_or_obj):
        kwargs = {}
        if isinstance(bundle_or_obj, Bundle):
                kwargs['pk'] = bundle_or_obj.obj._id
        else:
            kwargs['pk'] = bundle_or_obj._id
            return kwargs

    def get_object_list(self, request):
        # This will return a stripped down version of the run doc 
        # It includes _id, name, number (if applicable), and detector  
        self.throttle_check(request)
        self.log_throttled_access(request)

        query = {}

        if "query" in request.GET:
            query = request.GET['query']
        if "number" in request.GET:
            query['number'] = int(request.GET['number'])
        if "detector" in request.GET:
            query['detector'] = request.GET['detector']
        if "name" in request.GET:
            query['name'] = request.GET['name']
        if "_id" in request.GET:
            query['_id'] = request.GET['_id']


        cursor = self._db()[settings.RUNS_DB_COLLECTION].find(query).sort("_id", -1)

        ret = []
        for doc in cursor:
            if 'number' in doc:
                thedoc = {"number": doc['number'] }
            else:
                thedoc = {"number": -1}
            thedoc['name'] = doc['name']
            thedoc['_id'] = doc['_id']
            thedoc['detector'] = doc['detector']
            thedoc['doc'] = doc
            ret.append(rundoc(initial=thedoc))

        return ret


    def obj_get_list(self, bundle, **kwargs):
        return self.get_object_list(bundle.request)


    def obj_get(self, bundle, **kwargs):
        self.throttle_check(bundle.request)
        self.log_throttled_access(bundle.request)
        req = {}
        if 'pk' in kwargs:
            req['_id'] = kwargs['pk']
            return self._create_obj(req)
            return rundoc(initial={"error": "For now we only support searching for a run by number"})

    def _create_obj(self, req):

        doc = self._db()[settings.RUNS_DB_COLLECTION].find_one(
            {"_id":
             ObjectId(req['_id'])})
        if doc is None:
            return

        ret = {}
        if 'number' in doc:
            ret['number'] = doc['number']
        else:
            ret['number'] = -1
        ret['detector'] = doc['detector']
        ret['_id'] = doc['_id']
        ret['name'] = doc['name']
        ret['doc'] = doc
        ret_obj = rundoc(initial=ret)

        return ret_obj

    def obj_create(self, bundle, **kwargs):
        return self.obj_update(bundle, kwargs)



    def obj_update(self, bundle, **kwargs):
        self.throttle_check(bundle.request)
        self.log_throttled_access(bundle.request)
        searchDict = {}
        ret = {}

        reader = codecs.getreader("utf-8")
        request = (json.load(reader(bundle.request)))
        logger.error(request)
        if 'pk' in kwargs:
            searchDict['_id'] = ObjectId(kwargs['pk'])
        elif 'number' in request:
            searchDict['number'] = int(request['number'])
        elif 'name' in request and 'detector' in request:
            searchDict['name'] = request['name']
            searchDict['detector'] = request['detector']

        # We REQUIRE the following format
        # {
        #     "qname": a unique name for this check
        #     "version": the version info for this check 
        #     "checks": [] a list of string/bool pairs i.e. {"deadtime": true}
        #     "extracted": a dictionary of any format of size < 100kB
        # }

        
        updateDict = {}
        if ( 'qname' not in request or 'checks' not in request 
             or 'version' not in request):
            doc = self._default(
            "ERROR",
                        "Bad request. Require status, host, location, and type"
                    )
            bundle.obj = rundoc(initial=doc)
            bundle = self.full_hydrate(bundle)
            return bundle.obj

        updateDict['qname'] = request['qname']
        updateDict['checks'] = request['checks']
        updateDict['version'] = request['version']

        if 'extracted' in request:
            if sys.getsizeof(request['extracted']) > 50000:
                doc = self._default(
                    "ERROR",
                        "Bad request. Quality dictionary must be less than 50kB."
                )
                bundle.obj = rundoc(initial=doc)
                bundle = self.full_hydrate(bundle)
                return bundle.obj
            else:
                updateDict['extracted'] = request['extracted']

        # Enforce string/bool types for checks array
        for key, value in updateDict['checks']:
            extre = "test"
        if type(key) != type(extre) or type(value) != type(True):
                pass
        elif request['status'] == 'processed':
            if 'pax_version' not in request:
                return {"number": doc['number'],
                        "ERROR": "pax_version must be provided for processed data"}
            updateDict['pax_version'] = request['pax_version']

            # Status needed for new entry                                                                    
            updateDict['status'] = request['status']
            updateDict['creation_time'] = datetime.datetime.utcnow(),

            # Now add a new entry                                                                            
        res = self._db()[settings.RUNS_DB_COLLECTION].update_one(
                searchDict,
                {"$push": {"data": updateDict}})
        doc = self._default(
            "Success",
            "Document updated",
            res
            )
        bundle.obj = rundoc(initial=doc)
        bundle = self.full_hydrate(bundle)

        return rundoc(initial=doc)

    def _default(self, message, longer, return_value):
        doc = {
            "number": -1,
                "_id": -1,
            "detector": "ret",
                "name": message,
            "doc": {
                "message": longer,
                        "success": message,
                        "ret": return_value
                        }
            }
        return doc

    def obj_delete_list(self, bundle, **kwargs):
        pass
