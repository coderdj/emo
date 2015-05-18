__author__ = 'dan'



from pymongo import MongoClient
import pymongo
import datetime
import time
import pytz

# Inject a run control document
def inject_rc_doc():
    client = MongoClient( "localhost", 27017 )
    db = client['online']
    status_collection = db['daq_status']
    rates_collection = db['daq_rates']

    # Make TTL collections
    status_collection.create_index( [("createdAt", pymongo.DESCENDING)], expireAfterSeconds= 172800)
    rates_collection.create_index( [("createdAt", pymongo.DESCENDING)], expireAfterSeconds= 172800)

    starttime = datetime.datetime.now( datetime.timezone.utc )
    run_name = "injector_" + starttime.strftime( "%Y%m%d_%H%M%S")
    mv_name = "mv_" + starttime.strftime( "%Y%m%d_%H%M%S")
    rdr_list = [ 'daqrd0', 'daqrd1', 'daqrd2', 'daqrd3', 'daqrd4', 'mvrd1']

    while(1):

        nowtime = datetime.datetime.now( datetime.timezone.utc )

        status_doc_tpc = {
            "createdAt": nowtime,
            "detector": "tpc",
            "mode": "background",
            "state": "Running",
            "network": True,
            "currentRun": run_name,
            "startedBy": "coderre",
            "startTime": starttime,
            "numSlaves": 5,
        }

        status_doc_mv = {
            "createdAt": nowtime,
            "detector": "muon_veto",
            "mode": "background",
            "state": "Running",
            "network": True,
            "currentRun": mv_name,
            "startedBy": "coderre",
            "startTime": starttime,
            "numSlaves": 1,
        }

        status_collection.insert(status_doc_tpc)
        status_collection.insert(status_doc_mv)

        for reader in rdr_list:

            t_seconds = (nowtime-datetime.datetime(1970,1,1,tzinfo=pytz.utc)).total_seconds()

            rates_doc = {
                "createdAt": nowtime,
                "node": reader,
                "bltrate": 1500,
                "datarate": 15.2,
                "runmode": 'background',
                "nboards": 8,
                "timeseconds": t_seconds,
            }

            rates_collection.insert(rates_doc)

        time.sleep(10)

inject_rc_doc()
