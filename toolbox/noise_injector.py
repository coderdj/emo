__author__ = 'dan'

from random import randint
from pymongo import MongoClient
import datetime

model = [0.]*60
model[1] = 3
model[2] = 10.
model[3] = 1000.
model[4] = 1010.
model[5] = 1005.
model[6] = 1000.
model[7] = 900.
model[8] = 850.
model[9] = 750.
model[10] = 650.
model[11] = 400.
model[12] = 300.
model[13] = 100.
model[14] = 10.
model[15] = 5.
model[16] = 1.
model[17] = 1.
model[18] = 1.

# Inject noise docs
def inject_noise_spectra():

    client = MongoClient( "localhost", 27017 )
    db = client['noise']
    collection = db['directory']
    starttime = datetime.datetime.now( datetime.timezone.utc )

    doc = {
	    "run_name"  : 		"injector_" + starttime.strftime( "%Y%m%d_%H%M%S"),
	    "date"		:		starttime,
	    "collection": 		"injector_" + starttime.strftime( "%Y%m%d_%H%M%S"),
    }
    collection.insert(doc)
    print("Injected index doc")

    noise_collection = db['injector_' + starttime.strftime( "%Y%m%d_%H%M%S")]

    for channel in range(0, 248):

        fakenoisedoc = dict(name="channel_" + str(channel), type="h1",
                            run="injector_" + starttime.strftime("%Y%m%d_%H%M%S"), xaxis={
                "label": "ADC counts",
                "start": 0,  # starting value of first bin (only h1/h2)
            }, yaxis={
                "label": 'counts',
            }, data=[])

        sigma = 3

        data = []
        for adc_value in range(0, len(model)):
            data.append(model[adc_value] + randint(0, 2*sigma) -sigma)
            if data[adc_value] < 0.:
                data[adc_value] = 0.

        fakenoisedoc["data"] = data
        noise_collection.insert(fakenoisedoc)

inject_noise_spectra()