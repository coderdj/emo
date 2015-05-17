__author__ = 'dan'

from pymongo import MongoClient
import datetime

# Inject a run control document
def inject_rc_doc():
    client = MongoClient( "localhost", 27017 )
    db = client['online']
    collection = db['runs']
    nowtime = datetime.datetime.now( datetime.timezone.utc )
    run_name = "injector_" + nowtime.strftime( "%Y%m%d_%H%M%S")
    doc = {
	    "runmode": "fake_injector",
		"user": "injector",
		"name": run_name,
		"detector": "pycharm",
		"shorttype": "fake",
		"starttimestamp": nowtime,
		"endtimestamp": nowtime,
		"trigger": {
		  	"mode" : "faaake",
			"status": "not here",
			"ended": "sure",
		},
		"reader": {
			"options": "no options to report",
			"compressed": 0,
			"starttime": 192321,
			"endtime": 3984728,
			"data_taking_ended": True,
			"storage_buffer": {
				"dbname": "raw",
				"dbcollection": run_name,
				"dbaddr": "xebuffer",
		},
		"processor": {
			"mode": "default",
		},
		"comments": [
			{
				"user": "dan",
				"date": datetime.datetime.now( datetime.timezone.utc ),
				"text": "Created with test console",
			},
		],
	}
    }
    collection.insert( doc )

inject_rc_doc()
print("Done")


