__author__ = 'dan'

from pymongo import MongoClient
import pymongo
import datetime
import time
import pytz


def inject_rc_doc():

    """
    Function to inject a run mode.
    :return:
    """

    run_mode_dict = {

        "blt_size": 524288,
        "run_start": 1,
        "run_start_module": 1868,
        "muon_veto": 0,                     # NIM for S-IN prop to MV or not
        "pulser_freq": 0,                   # 0 inactive
        "write_mode": 0,                    # 0 -none, 1-file, 2-MongoDB
        "compression": 1,                   # 0 -none, 1-snappy
        "baseline_mode": 1,                 # 0 -load from file, 1-run start, 2-none
        "processing_num_threads": 8,        # Number of processing threads
        "processing_mode":  4,              # Parsing mode: 0-none, 1-event, 2-occurrence, 3-occurrenceZLE, 4-new FW
        "processing_readout_threshold": 1,  # # of BLTs that must be in board buffer before it's read
        "occurrence_integral": 0,           # Integrate each pulse (! Only processing modes 2,3,4) 0-off, 1-on
        "file_path": "",
        "file_events_per_file": 1000000,
        "mongo_address": "xedaq00",
        "mongo_database": "raw",
        "mongo_collection": "data*",
        "mongo_write_concern": 0,           # 0- No write concern, 1- on
        "mongo_min_insert_size": 1,         # minimum size of BSON vector for bulk inserts

        "registers": [
            {
                "register": "EF24",
                "value": "0",
                "board": "-1",
                "comment": "board reset register"
            },
            {
                "register": "EF1C",
                "value": "1",
                "board": "-1",
                "comment": "events per BLT"
            },
            {
                "register": "EF00",
                "value": "10",
                "board": "-1",
                "comment": "BERR register, 10=enable BERR",
            },
            {
                "register": "8100",
                "value": "0",
                "board": "-1",
                "comment": "acquisition control register. Always set to 0"
            },

        ],
        "DDC-10": {
            "address": "130.92.139.240",
            "sign": 1,
            "window": 100,
            "delay": 200,
            "signal_threshold": 150,
            "integration_threshold": 20000,
            "width_cut": 50,
            "rise_time_cut": 30,
            "component_status": 1,
            "parameter_0": 0,
            "parameter_1": 0,
            "parameter_2": 0,
            "parameter_3": 50,
            "outer_ring_factor": 2,
            "inner_ring_factor": 1,
            "prescaling": 1000,
        },
        "links": [
            {
                "type": "V2718",
                "link": 0,
                "crate": 0,
                "reader": 0,
            },
            {
                "type": "V2718",
                "link": 0,
                "board": 0,
                "reader": 1,
            }
        ],
        "boards": [
            {
                "type": "V1724",
                "link": 0,
                "board": 0,
                "vme_address": "32100000",
                "serial": "876",
                "reader": 0,
            },
            {
                "type": "V1724",
                "link": 0,
                "board": 0,
                "vme_address": "22230000",
                "serial": "770",
                "reader": 1,
            },
        ]
    }





