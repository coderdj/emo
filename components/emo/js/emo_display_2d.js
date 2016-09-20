/* 
   File:     tpc_3d.js
   Author:   Daniel Coderre
   Date:     29.04.2014

   Brief:    Helper functions to make a 3D event display work

*/
/* 
   This is a bunch of stuff to make the 3D TPC event display work.
   These functions are used for the 3D display as well as the embedded one in the
   waveform viewer.
   If you are good at javascript you may cringe reading this code. Feel free to 
   improve it.
*/

//XENON1T Map
var g_pmt_map={0: {'x': -12.345668451390225, 'y': 46.074661913988564}, 1: {'x': -4.157328929063286, 'y': 47.518487098976266}, 2: {'x': 4.1573289290632935, 'y': 47.51848709897626}, 3: {'x': 12.345668451390232, 'y': 46.07466191398856}, 4: {'x': 20.158891085031385, 'y': 43.230881441648194}, 5: {'x': 27.35959601394491, 'y': 39.073552512584904}, 6: {'x': 33.72899346259835, 'y': 33.72899346259829}, 7: {'x': 39.073552512584904, 'y': 27.359596013944902}, 8: {'x': 43.23088144164822, 'y': 20.158891085031343}, 9: {'x': 46.074661913988564, 'y': 12.345668451390226}, 10: {'x': 47.518487098976266, 'y': 4.157328929063288}, 11: {'x': 47.51848709897626, 'y': -4.157328929063292}, 12: {'x': 46.07466191398855, 'y': -12.34566845139027}, 13: {'x': 43.230881441648194, 'y': -20.158891085031378}, 14: {'x': 39.07355251258489, 'y': -27.359596013944923}, 15: {'x': 33.72899346259832, 'y': -33.72899346259832}, 16: {'x': 27.35959601394489, 'y': -39.07355251258491}, 17: {'x': 20.158891085031346, 'y': -43.23088144164822}, 18: {'x': 12.34566845139023, 'y': -46.074661913988564}, 19: {'x': 4.157328929063292, 'y': -47.518487098976266}, 20: {'x': -4.1573289290633095, 'y': -47.51848709897626}, 21: {'x': -12.345668451390264, 'y': -46.07466191398856}, 22: {'x': -20.158891085031378, 'y': -43.230881441648194}, 23: {'x': -27.359596013944902, 'y': -39.07355251258491}, 24: {'x': -33.728993462598325, 'y': -33.728993462598304}, 25: {'x': -39.07355251258492, 'y': -27.359596013944888}, 26: {'x': -43.23088144164821, 'y': -20.158891085031357}, 27: {'x': -46.074661913988564, 'y': -12.345668451390232}, 28: {'x': -47.518487098976266, 'y': -4.157328929063286}, 29: {'x': -47.51848709897626, 'y': 4.157328929063306}, 30: {'x': -46.07466191398856, 'y': 12.345668451390251}, 31: {'x': -43.2308814416482, 'y': 20.15889108503137}, 32: {'x': -39.073552512584904, 'y': 27.359596013944902}, 33: {'x': -33.72899346259831, 'y': 33.72899346259832}, 34: {'x': -27.359596013944895, 'y': 39.07355251258491}, 35: {'x': -20.158891085031357, 'y': 43.23088144164821}, 36: {'x': -10.288057042825152, 'y': 38.39555159499048}, 37: {'x': -2.0803542606570264, 'y': 39.69552400649432}, 38: {'x': 6.218269985349179, 'y': 39.260611538656725}, 39: {'x': 14.245125994425699, 'y': 37.10982195326377}, 40: {'x': 21.64940164184732, 'y': 33.33715507583061}, 41: {'x': 28.107494552165267, 'y': 28.107494552165264}, 42: {'x': 33.33715507583061, 'y': 21.649401641847316}, 43: {'x': 37.10982195326378, 'y': 14.245125994425663}, 44: {'x': 39.26061153865673, 'y': 6.218269985349142}, 45: {'x': 39.6955240064943, 'y': -2.080354260657028}, 46: {'x': 38.39555159499045, 'y': -10.288057042825226}, 47: {'x': 35.41750933648761, 'y': -18.046122364647005}, 48: {'x': 30.891551967914587, 'y': -25.01548554423105}, 49: {'x': 25.015485544231034, 'y': -30.8915519679146}, 50: {'x': 18.04612236464697, 'y': -35.41750933648763}, 51: {'x': 10.288057042825173, 'y': -38.39555159499047}, 52: {'x': 2.080354260657014, 'y': -39.69552400649432}, 53: {'x': -6.218269985349176, 'y': -39.260611538656725}, 54: {'x': -14.245125994425695, 'y': -37.10982195326377}, 55: {'x': -21.64940164184734, 'y': -33.337155075830594}, 56: {'x': -28.10749455216527, 'y': -28.107494552165253}, 57: {'x': -33.33715507583061, 'y': -21.64940164184732}, 58: {'x': -37.109821953263776, 'y': -14.245125994425678}, 59: {'x': -39.260611538656725, 'y': -6.218269985349172}, 60: {'x': -39.6955240064943, 'y': 2.080354260657023}, 61: {'x': -38.395551594990465, 'y': 10.288057042825208}, 62: {'x': -35.41750933648762, 'y': 18.04612236464699}, 63: {'x': -30.891551967914587, 'y': 25.01548554423104}, 64: {'x': -25.015485544231034, 'y': 30.8915519679146}, 65: {'x': -18.04612236464698, 'y': 35.41750933648763}, 66: {'x': -8.23044563426015, 'y': 30.716441275992377}, 67: {'x': 3.108624468950438e-14, 'y': 31.8}, 68: {'x': 8.230445634260182, 'y': 30.716441275992366}, 69: {'x': 15.90000000000001, 'y': 27.53960784034514}, 70: {'x': 22.485995641732213, 'y': 22.485995641732213}, 71: {'x': 27.53960784034516, 'y': 15.899999999999984}, 72: {'x': 30.716441275992374, 'y': 8.230445634260152}, 73: {'x': 31.8, 'y': 0.0}, 74: {'x': 30.716441275992366, 'y': -8.230445634260182}, 75: {'x': 27.539607840345138, 'y': -15.90000000000002}, 76: {'x': 22.485995641732202, 'y': -22.485995641732224}, 77: {'x': 15.899999999999999, 'y': -27.539607840345152}, 78: {'x': 8.230445634260153, 'y': -30.716441275992374}, 79: {'x': -1.3322676295501878e-14, 'y': -31.8}, 80: {'x': -8.230445634260162, 'y': -30.716441275992374}, 81: {'x': -15.900000000000006, 'y': -27.539607840345145}, 82: {'x': -22.485995641732217, 'y': -22.485995641732202}, 83: {'x': -27.539607840345152, 'y': -15.899999999999993}, 84: {'x': -30.716441275992374, 'y': -8.230445634260155}, 85: {'x': -31.8, 'y': 3.552713678800501e-15}, 86: {'x': -30.71644127599237, 'y': 8.230445634260168}, 87: {'x': -27.539607840345145, 'y': 15.900000000000006}, 88: {'x': -22.48599564173221, 'y': 22.485995641732217}, 89: {'x': -15.899999999999997, 'y': 27.539607840345152}, 90: {'x': -6.172834225695112, 'y': 23.037330956994282}, 91: {'x': 2.0786644645316468, 'y': 23.75924354948813}, 92: {'x': 10.079445542515693, 'y': 21.615440720824097}, 93: {'x': 16.864496731299177, 'y': 16.864496731299145}, 94: {'x': 21.61544072082411, 'y': 10.079445542515671}, 95: {'x': 23.759243549488133, 'y': 2.078664464531644}, 96: {'x': 23.037330956994275, 'y': -6.172834225695135}, 97: {'x': 19.536776256292445, 'y': -13.679798006972462}, 98: {'x': 13.679798006972446, 'y': -19.536776256292455}, 99: {'x': 6.172834225695115, 'y': -23.037330956994282}, 100: {'x': -2.0786644645316548, 'y': -23.75924354948813}, 101: {'x': -10.079445542515689, 'y': -21.615440720824097}, 102: {'x': -16.864496731299162, 'y': -16.864496731299152}, 103: {'x': -21.615440720824104, 'y': -10.079445542515678}, 104: {'x': -23.759243549488133, 'y': -2.078664464531643}, 105: {'x': -23.03733095699428, 'y': 6.172834225695126}, 106: {'x': -19.536776256292452, 'y': 13.679798006972451}, 107: {'x': -13.679798006972447, 'y': 19.536776256292455}, 108: {'x': -4.115222817130075, 'y': 15.358220637996189}, 109: {'x': 4.115222817130091, 'y': 15.358220637996183}, 110: {'x': 11.242997820866107, 'y': 11.242997820866107}, 111: {'x': 15.358220637996187, 'y': 4.115222817130076}, 112: {'x': 15.358220637996183, 'y': -4.115222817130091}, 113: {'x': 11.242997820866101, 'y': -11.242997820866112}, 114: {'x': 4.115222817130077, 'y': -15.358220637996187}, 115: {'x': -4.115222817130081, 'y': -15.358220637996187}, 116: {'x': -11.242997820866108, 'y': -11.242997820866101}, 117: {'x': -15.358220637996187, 'y': -4.1152228171300775}, 118: {'x': -15.358220637996185, 'y': 4.115222817130084}, 119: {'x': -11.242997820866105, 'y': 11.242997820866108}, 120: {'x': -2.0576114085650374, 'y': 7.679110318998094}, 121: {'x': 5.621498910433053, 'y': 5.621498910433053}, 122: {'x': 7.679110318998092, 'y': -2.0576114085650454}, 123: {'x': 2.0576114085650383, 'y': -7.679110318998093}, 124: {'x': -5.621498910433054, 'y': -5.621498910433051}, 125: {'x': -7.6791103189980925, 'y': 2.057611408565042}, 126: {'x': 0.0, 'y': 0.0}, 127: {'x': -30.689924073888996, 'y': 32.28201605133931}, 128: {'x': -23.2988878137987, 'y': 35.34348351026003}, 129: {'x': -15.907851553708406, 'y': 38.404950969180746}, 130: {'x': -8.516815293618112, 'y': 41.46641842810146}, 131: {'x': -1.1257790335278184, 'y': 44.52788588702218}, 132: {'x': -39.1251698717397, 'y': 21.2889897014281}, 133: {'x': -31.734133611649405, 'y': 24.35045716034882}, 134: {'x': -24.34309735155911, 'y': 27.41192461926954}, 135: {'x': -16.952061091468817, 'y': 30.47339207819026}, 136: {'x': -9.561024831378525, 'y': 33.534859537110975}, 137: {'x': -2.169988571288231, 'y': 36.59632699603169}, 138: {'x': 5.221047688802065, 'y': 39.65779445495241}, 139: {'x': 12.612083948892357, 'y': 42.71926191387313}, 140: {'x': -40.16937940950011, 'y': 13.357430810437622}, 141: {'x': -32.77834314940982, 'y': 16.41889826935834}, 142: {'x': -25.387306889319525, 'y': 19.480365728279057}, 143: {'x': -17.99627062922923, 'y': 22.541833187199778}, 144: {'x': -10.605234369138937, 'y': 25.603300646120495}, 145: {'x': -3.2141981090486436, 'y': 28.66476810504121}, 146: {'x': 4.17683815104165, 'y': 31.726235563961932}, 147: {'x': 11.567874411131942, 'y': 34.78770302288265}, 148: {'x': 18.958910671222238, 'y': 37.84917048180337}, 149: {'x': -41.213588947260526, 'y': 5.425871919447141}, 150: {'x': -33.82255268717023, 'y': 8.487339378367858}, 151: {'x': -26.431516427079938, 'y': 11.548806837288577}, 152: {'x': -19.040480166989642, 'y': 14.610274296209296}, 153: {'x': -11.64944390689935, 'y': 17.671741755130014}, 154: {'x': -4.258407646809056, 'y': 20.73320921405073}, 155: {'x': 3.132628613281237, 'y': 23.79467667297145}, 156: {'x': 10.523664873371533, 'y': 26.85614413189217}, 157: {'x': 17.914701133461826, 'y': 29.91761159081289}, 158: {'x': 25.305737393552118, 'y': 32.979079049733606}, 159: {'x': -42.25779848502094, 'y': -2.5056869715433443}, 160: {'x': -34.866762224930646, 'y': 0.5557804873773744}, 161: {'x': -27.47572596484035, 'y': 3.617247946298093}, 162: {'x': -20.084689704750055, 'y': 6.678715405218811}, 163: {'x': -12.693653444659763, 'y': 9.740182864139529}, 164: {'x': -5.302617184569469, 'y': 12.801650323060247}, 165: {'x': 2.088419075520825, 'y': 15.863117781980966}, 166: {'x': 9.479455335611119, 'y': 18.924585240901685}, 167: {'x': 16.87049159570141, 'y': 21.9860526998224}, 168: {'x': 24.261527855791705, 'y': 25.04752015874312}, 169: {'x': 31.652564115882, 'y': 28.10898761766384}, 170: {'x': -43.30200802278135, 'y': -10.437245862533826}, 171: {'x': -35.910971762691055, 'y': -7.375778403613108}, 172: {'x': -28.519935502600763, 'y': -4.314310944692391}, 173: {'x': -21.12889924251047, 'y': -1.2528434857716721}, 174: {'x': -13.737862982420175, 'y': 1.8086239731490465}, 175: {'x': -6.346826722329881, 'y': 4.870091432069764}, 176: {'x': 1.0442095377604126, 'y': 7.931558890990483}, 177: {'x': 8.435245797850705, 'y': 10.9930263499112}, 178: {'x': 15.826282057941, 'y': 14.05449380883192}, 179: {'x': 23.217318318031293, 'y': 17.11596126775264}, 180: {'x': 30.608354578121585, 'y': 20.177428726673355}, 181: {'x': 37.99939083821188, 'y': 23.238896185594072}, 182: {'x': -36.95518130045147, 'y': -15.307337294603592}, 183: {'x': -29.564145040361176, 'y': -12.245869835682873}, 184: {'x': -22.17310878027088, 'y': -9.184402376762154}, 185: {'x': -14.782072520180588, 'y': -6.1229349178414365}, 186: {'x': -7.391036260090294, 'y': -3.0614674589207183}, 187: {'x': 0.0, 'y': 0.0}, 188: {'x': 7.391036260090294, 'y': 3.0614674589207183}, 189: {'x': 14.782072520180588, 'y': 6.1229349178414365}, 190: {'x': 22.17310878027088, 'y': 9.184402376762154}, 191: {'x': 29.564145040361176, 'y': 12.245869835682873}, 192: {'x': 36.95518130045147, 'y': 15.307337294603592}, 193: {'x': -37.99939083821188, 'y': -23.238896185594072}, 194: {'x': -30.608354578121585, 'y': -20.177428726673355}, 195: {'x': -23.217318318031293, 'y': -17.11596126775264}, 196: {'x': -15.826282057941, 'y': -14.05449380883192}, 197: {'x': -8.435245797850705, 'y': -10.9930263499112}, 198: {'x': -1.0442095377604126, 'y': -7.931558890990483}, 199: {'x': 6.346826722329881, 'y': -4.870091432069764}, 200: {'x': 13.737862982420175, 'y': -1.8086239731490465}, 201: {'x': 21.12889924251047, 'y': 1.2528434857716721}, 202: {'x': 28.519935502600763, 'y': 4.314310944692391}, 203: {'x': 35.910971762691055, 'y': 7.375778403613108}, 204: {'x': 43.30200802278135, 'y': 10.437245862533826}, 205: {'x': -31.652564115882, 'y': -28.10898761766384}, 206: {'x': -24.261527855791705, 'y': -25.04752015874312}, 207: {'x': -16.87049159570141, 'y': -21.9860526998224}, 208: {'x': -9.479455335611119, 'y': -18.924585240901685}, 209: {'x': -2.088419075520825, 'y': -15.863117781980966}, 210: {'x': 5.302617184569469, 'y': -12.801650323060247}, 211: {'x': 12.693653444659763, 'y': -9.740182864139529}, 212: {'x': 20.084689704750055, 'y': -6.678715405218811}, 213: {'x': 27.47572596484035, 'y': -3.617247946298093}, 214: {'x': 34.866762224930646, 'y': -0.5557804873773744}, 215: {'x': 42.25779848502094, 'y': 2.5056869715433443}, 216: {'x': -25.305737393552118, 'y': -32.979079049733606}, 217: {'x': -17.914701133461826, 'y': -29.91761159081289}, 218: {'x': -10.523664873371533, 'y': -26.85614413189217}, 219: {'x': -3.132628613281237, 'y': -23.79467667297145}, 220: {'x': 4.258407646809056, 'y': -20.73320921405073}, 221: {'x': 11.64944390689935, 'y': -17.671741755130014}, 222: {'x': 19.040480166989642, 'y': -14.610274296209296}, 223: {'x': 26.431516427079938, 'y': -11.548806837288577}, 224: {'x': 33.82255268717023, 'y': -8.487339378367858}, 225: {'x': 41.213588947260526, 'y': -5.425871919447141}, 226: {'x': -18.958910671222238, 'y': -37.84917048180337}, 227: {'x': -11.567874411131942, 'y': -34.78770302288265}, 228: {'x': -4.17683815104165, 'y': -31.726235563961932}, 229: {'x': 3.2141981090486436, 'y': -28.66476810504121}, 230: {'x': 10.605234369138937, 'y': -25.603300646120495}, 231: {'x': 17.99627062922923, 'y': -22.541833187199778}, 232: {'x': 25.387306889319525, 'y': -19.480365728279057}, 233: {'x': 32.77834314940982, 'y': -16.41889826935834}, 234: {'x': 40.16937940950011, 'y': -13.357430810437622}, 235: {'x': -12.612083948892357, 'y': -42.71926191387313}, 236: {'x': -5.221047688802065, 'y': -39.65779445495241}, 237: {'x': 2.169988571288231, 'y': -36.59632699603169}, 238: {'x': 9.561024831378525, 'y': -33.534859537110975}, 239: {'x': 16.952061091468817, 'y': -30.47339207819026}, 240: {'x': 24.34309735155911, 'y': -27.41192461926954}, 241: {'x': 31.734133611649405, 'y': -24.35045716034882}, 242: {'x': 39.1251698717397, 'y': -21.2889897014281}, 243: {'x': 1.1257790335278184, 'y': -44.52788588702218}, 244: {'x': 8.516815293618112, 'y': -41.46641842810146}, 245: {'x': 15.907851553708406, 'y': -38.404950969180746}, 246: {'x': 23.2988878137987, 'y': -35.34348351026003}, 247: {'x': 30.689924073888996, 'y': -32.28201605133931}};

function Draw2DDisplay(data, div_top, div_bottom){
    // Data must be a list of values at least 248 elements long (longer is ignored)
    console.log("2D DISPLAY");
    if(data.length < g_pmt_map.length)
	return;

    var dat_top = [
	{ 
	    "x": [],
	    "y": [],
	    "text": [],
	    "size": [],
	    "mode": "markers",
	    autocolorscale: true,
	    showscale: true,
	    marker: {
//		sizemode: 'area',
		size: [],
		color: [],
		sizeref: 50,
		sizemin: 2,
		colorbar: {
                    title: 'Rate',
                    ticksuffix: 'Hz',
                    showticksuffix: 'last',
		    thickness: 10
                },
	    }
	}
    ];
    var dat_bottom = [
	{
            "x": [],
            "y": [],
	    "text": [],
	    "size": [],
            "mode": "markers",
	    autocolorscale: true,
	    showscale: true,
	    marker: {
//                sizemode: 'area',
                size: [],
		color: [],
                sizeref: 50,
		sizemin: 2,
		colorbar: {
		    title: 'Rate',
		    ticksuffix: 'Hz',
		    showticksuffix: 'last',
		    thickness: 10
		},
            }

	    }
    ];    

    var layout_top = { shapes: [], 
		       title: "Top Array",
		       hovermode: 'closest',
		       hoverinfo: "text",
		       showscale: true,
		       margin: {"t": 25, "b": 5, "l": 5, "r": 50},
		       xaxis: {
			   color: '#fff',
			   linecolor: '#fff',
			   showticklabels: false,
			   showgrid: false,
		       },
		       yaxis: {
                           color: '#fff',
                           linecolor: '#fff',
                           showticklabels: false,
			   showgrid: false,
                       },
		     };
    var layout_bottom = { "shapes": [], 
			  title: "Bottom Array",
			  hovermode: 'closest',
			  hoverinfo: "text",			  
			  showscale: true,
			  "margin": {"t": 25, "b": 5, "l": 5, "r": 50},
			  xaxis: {
                              color: '#fff',
                              linecolor: '#fff',
                              showticklabels: false,
			      showgrid: false,
			  },
			  yaxis: {
                              color: '#fff',
                              linecolor: '#fff',
                              showticklabels: false,
			      showgrid: false
			  },
			};

    var maxtop=0;
    var maxbottom=0;
    for(x=0; x<248; x+=1){


	var sizefactor = 1;//.3;
	// Data?
	if( x<= 126){
	    
	    if(data[x]>maxtop)
		maxtop = data[x];
	    dat_top[0]['x'].push(g_pmt_map[x.toString()]['x']);
	    dat_top[0]['y'].push(g_pmt_map[x.toString()]['y']);
	    dat_top[0]['marker']['size'].push(sizefactor*data[x]);
	    dat_top[0]['marker']['color'].push(sizefactor*data[x]);

	    dat_top[0]['text'].push("PMT " + x.toString() + 
				    ": " + data[x].toFixed(2) + " Hz");
	}
	else{
	    if(data[x]>maxbottom)
		maxbottom=data[x];
	    dat_bottom[0]['x'].push(g_pmt_map[x.toString()]['x']);
	    dat_bottom[0]['y'].push(g_pmt_map[x.toString()]['y']);	   
	    dat_bottom[0]['marker']['size'].push(sizefactor*data[x]);
	    dat_bottom[0]['marker']['color'].push(sizefactor*data[x]);
	    dat_bottom[0]['text'].push("PMT " + x.toString() +
                                    ": " + data[x].toFixed(2) + " Hz");


	}

	// Make the shape!
	var sizefactor = 3;
	/*new_shape = {
	    type: 'circle',
            xref: 'x',
            yref: 'y',
            x0: g_pmt_map[x]['x']-sizefactor,
            y0: g_pmt_map[x]['y']-sizefactor,
            x1: g_pmt_map[x]['x']+sizefactor,
            y1: g_pmt_map[x]['y']+sizefactor,
            opacity: 0.2,
            fillcolor: 'blue',
            line: {
                color: 'blue'
            }
	}

	if(x<=126)
	    layout_top['shapes'].push(new_shape);
	else
	    layout_bottom['shapes'].push(new_shape);
*/
    }

    dat_top[0]['marker']['sizeref'] = maxtop * 80/2000;
    dat_bottom[0]['marker']['sizeref'] = maxbottom * 80/2000;

    console.log(layout_top);
    Plotly.newPlot(div_top, dat_top, layout_top, {displayModeBar: false});
    Plotly.newPlot(div_bottom, dat_bottom, layout_bottom, {displayModeBar: false});

}
