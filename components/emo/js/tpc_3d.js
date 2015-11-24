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


// XENON100 PMT Map
var g_pmt_map = { 0 : {'x' : 0, 'y' : 0},
                  1 : {'x' : 166.84, 'y' : 0.00},     2 : {'x' : 163.19, 'y' : 34.69},
                  3 : {'x' : 152.42, 'y' : 67.86},    4 : {'x' : 134.98, 'y' : 98.07},
                  5 : {'x' : 111.64, 'y' : 123.99},   6 : {'x' : 83.42, 'y' : 144.49},
                  7 : {'x' : 51.56, 'y' : 158.67},    8 : {'x' : 17.44, 'y' : 165.93},
                  9 : {'x' : -17.44, 'y' : 165.93},   10 : {'x' : -51.56, 'y' : 158.67},
                  11 : {'x' : -83.42, 'y' : 144.49},  12 : {'x' : -111.64, 'y' : 123.99},
                  13 : {'x' : -134.98, 'y' : 98.07},  14 : {'x' : -152.42, 'y' : 67.86},
                  15 : {'x' : -163.19, 'y' : 34.69},  16 : {'x' : -166.84, 'y' : 0.00},
                  17 : {'x' : -163.19, 'y' : -34.69}, 18 : {'x' : -152.42, 'y' : -67.86},
                  19 : {'x' : -134.98, 'y' : -98.07}, 20 : {'x' : -111.64, 'y' : -123.99},
                  21 : {'x' : -83.42, 'y' : -144.49}, 22 : {'x' : -51.56, 'y' : -158.67},
                  23 : {'x' : -17.44, 'y' : -165.93}, 24 : {'x' : 17.44, 'y' : -165.93},
                  25 : {'x' : 51.56, 'y' : -158.67},  26 : {'x' : 83.42, 'y' : -144.49},
                  27 : {'x' : 111.64, 'y' : -123.99}, 28 : {'x' : 134.98, 'y' : -98.07},
                  29 : {'x' : 152.42, 'y' : -67.86},  30 : {'x' : 163.19, 'y' : -34.69},
                  31 : {'x' : 136.53, 'y' : 0.00},    32 : {'x' : 131.88, 'y' : 35.34},
                  33 : {'x' : 118.24, 'y' : 68.27},   34 : {'x' : 96.54, 'y' : 96.54},
                  35 : {'x' : 68.27, 'y' : 118.24},   36 : {'x' : 35.34, 'y' : 131.88},
                  37 : {'x' : 0.00, 'y' : 136.53},    38 : {'x' : -35.34, 'y' : 131.88},
                  39 : {'x' : -68.27, 'y' : 118.24},  40 : {'x' : -96.54, 'y' : 96.54},
                  41 : {'x' : -118.24, 'y' : 68.27},  42 : {'x' : -131.88, 'y' : 35.34},
                  43 : {'x' : -136.53, 'y' : 0.00},   44 : {'x' : -131.88, 'y' : -35.34},
                  45 : {'x' : -118.24, 'y' : -68.27}, 46 : {'x' : -96.54, 'y' : -96.54},
                  47 : {'x' : -68.27, 'y' : -118.24}, 48 : {'x' : -35.34, 'y' : -131.88},
                  49 : {'x' : -0.00, 'y' : -136.53},  50 : {'x' : 35.34, 'y' : -131.88},
                  51 : {'x' : 68.27, 'y' : -118.24},  52 : {'x' : 96.54, 'y' : -96.54},
                  53 : {'x' : 118.24, 'y' : -68.27},  54 : {'x' : 131.88, 'y' : -35.34},
                  55 : {'x' : 106.20, 'y' : 0.00},    56 : {'x' : 101.00, 'y' : 32.82},
                  57 : {'x' : 85.92, 'y' : 62.42},    58 : {'x' : 62.42, 'y' : 85.92},
                  59 : {'x' : 32.82, 'y' : 101.00},   60 : {'x' : 0.00, 'y' : 106.20},
                  61 : {'x' : -32.82, 'y' : 101.00},  62 : {'x' : -62.42, 'y' : 85.92},
                  63 : {'x' : -85.92, 'y' : 62.42},   64 : {'x' : -101.00, 'y' : 32.82},
                  65 : {'x' : -106.20, 'y' : 0.00},   66 : {'x' : -101.00, 'y' : -32.82},
                  67 : {'x' : -85.92, 'y' : -62.42},  68 : {'x' : -62.42, 'y' : -85.92},
                  69 : {'x' : -32.82, 'y' : -101.00}, 70 : {'x' : -0.00, 'y' : -106.20},
                  71 : {'x' : 32.82, 'y' : -101.00},  72 : {'x' : 62.42, 'y' : -85.92},
                  73 : {'x' : 85.92, 'y' : -62.42},   74 : {'x' : 101.00, 'y' : -32.82},
                  75 : {'x' : 75.87, 'y' : 0.00},     76 : {'x' : 68.76, 'y' : 32.06},
                  77 : {'x' : 47.75, 'y' : 58.96},    78 : {'x' : 17.07, 'y' : 73.93},
                  79 : {'x' : -15.77, 'y' : 74.21},   80 : {'x' : -46.71, 'y' : 59.79},
                  81 : {'x' : -68.19, 'y' : 33.26},   82 : {'x' : -75.87, 'y' : 0.00},
                  83 : {'x' : -68.76, 'y' : -32.06},  84 : {'x' : -47.75, 'y' : -58.96},
                  85 : {'x' : -17.07, 'y' : -73.93},  86 : {'x' : 15.77, 'y' : -74.21},
                  87 : {'x' : 46.71, 'y' : -59.79},   88 : {'x' : 68.19, 'y' : -33.26},
                  89 : {'x' : 45.00, 'y' : 0.00},     90 : {'x' : 30.00, 'y' : 30.00},
                  91 : {'x' : -0.00, 'y' : 45.00},    92 : {'x' : -30.00, 'y' : 30.00},
                  93 : {'x' : -45.00, 'y' : 0.00},    94 : {'x' : -30.00, 'y' : -30.00},
                  95 : {'x' : -0.00, 'y' : -45.00},   96 : {'x' : 30.00, 'y' : -30.00},
                  97 : {'x' : 15.00, 'y' : 0.00},     98 : {'x' : -15.00, 'y' : 0.00},
                  99 : {'x' : -41.15, 'y' : 123.44},  100 : {'x' : -13.71, 'y' : 123.44},
                  101 : {'x' : 13.71, 'y' : 123.44},  102 : {'x' : 41.15, 'y' : 123.44},
                  103 : {'x' : -82.29, 'y' : 96.00},  104 : {'x' : -54.86, 'y' : 96.00},
                  105 : {'x' : -27.43, 'y' : 96.00},  106 : {'x' : 0.00, 'y' : 96.00},
                  107 : {'x' : 27.43, 'y' : 96.00},   108 : {'x' : 54.86, 'y' : 96.00},
                  109 : {'x' : 82.29, 'y' : 96.00},   110 : {'x' : -109.72, 'y' : 68.58},
                  111 : {'x' : -82.29, 'y' : 68.58},  112 : {'x' : -54.86, 'y' : 68.58},
                  113 : {'x' : -27.43, 'y' : 68.58},  114 : {'x' : 0.00, 'y' : 68.58},
                  115 : {'x' : 27.43, 'y' : 68.58},   116 : {'x' : 54.86, 'y' : 68.58},
                  117 : {'x' : 82.29, 'y' : 68.58},   118 : {'x' : 109.72, 'y' : 68.58},
                  119 : {'x' : -123.44, 'y' : 41.15}, 120 : {'x' : -96.00, 'y' : 41.15},
                  121 : {'x' : -68.58, 'y' : 41.15},  122 : {'x' : -41.15, 'y' : 41.15},
                  123 : {'x' : -13.71, 'y' : 41.15},  124 : {'x' : 13.71, 'y' : 41.15},
                  125 : {'x' : 41.15, 'y' : 41.15},   126 : {'x' : 68.58, 'y' : 41.15},
                  127 : {'x' : 96.00, 'y' : 41.15},   128 : {'x' : 123.44, 'y' : 41.15},
                  129 : {'x' : -123.44, 'y' : 13.71}, 130 : {'x' : -96.00, 'y' : 13.71},
                  131 : {'x' : -68.58, 'y' : 13.71},  132 : {'x' : -41.15, 'y' : 13.71},
                  133 : {'x' : -13.71, 'y' : 13.71},  134 : {'x' : 13.71, 'y' : 13.71},
                  135 : {'x' : 41.15, 'y' : 13.71},   136 : {'x' : 68.58, 'y' : 13.71},
                  137 : {'x' : 96.00, 'y' : 13.71},   138 : {'x' : 123.44, 'y' : 13.71},
                  139 : {'x' : -123.44, 'y' : -13.71},        140 : {'x' : -96.00, 'y' : -13.71},
                  141 : {'x' : -68.58, 'y' : -13.71}, 142 : {'x' : -41.15, 'y' : -13.71},
                  143 : {'x' : -13.71, 'y' : -13.71}, 144 : {'x' : 13.71, 'y' : -13.71},
                  145 : {'x' : 41.15, 'y' : -13.71},  146 : {'x' : 68.58, 'y' : -13.71},
                  147 : {'x' : 96.00, 'y' : -13.71},  148 : {'x' : 123.44, 'y' : -13.71},
                  149 : {'x' : -123.44, 'y' : -41.15},        150 : {'x' : -96.00, 'y' : -41.15},
                  151 : {'x' : -68.58, 'y' : -41.15}, 152 : {'x' : -41.15, 'y' : -41.15},
                  153 : {'x' : -13.71, 'y' : -41.15}, 154 : {'x' : 13.71, 'y' : -41.15},
                  155 : {'x' : 41.15, 'y' : -41.15},  156 : {'x' : 68.58, 'y' : -41.15},
                  157 : {'x' : 96.00, 'y' : -41.15},  158 : {'x' : 123.44, 'y' : -41.15},
                  159 : {'x' : -109.72, 'y' : -68.58},        160 : {'x' : -82.29, 'y' : -68.58},
                  161 : {'x' : -54.86, 'y' : -68.58}, 162 : {'x' : -27.43, 'y' : -68.58},
                  163 : {'x' : 0.00, 'y' : -68.58},   164 : {'x' : 27.43, 'y' : -68.58},
                  165 : {'x' : 54.86, 'y' : -68.58},  166 : {'x' : 82.29, 'y' : -68.58},
                  167 : {'x' : 109.72, 'y' : -68.58}, 168 : {'x' : -82.29, 'y' : -96.00},
                  169 : {'x' : -54.86, 'y' : -96.00}, 170 : {'x' : -27.43, 'y' : -96.00},
                  171 : {'x' : 0.00, 'y' : -96.00},   172 : {'x' : 27.43, 'y' : -96.00},
                  173 : {'x' : 54.86, 'y' : -96.00},  174 : {'x' : 82.29, 'y' : -96.00},
                  175 : {'x' : -41.15, 'y' : -123.44},        176 : {'x' : -13.71, 'y' : -123.44},
                  177 : {'x' : 13.71, 'y' : -123.44}, 178 : {'x' : 41.15, 'y' : -123.44},
                  179 : {'x' : 197.15, 'y' : 0.00},   180 : {'x' : 193.53, 'y' : 37.62},
                  181 : {'x' : 182.79, 'y' : 73.85},  182 : {'x' : 165.34, 'y' : 107.38},
                  183 : {'x' : 139.41, 'y' : 139.41}, 184 : {'x' : 110.25, 'y' : 163.44},
                  185 : {'x' : 77.03, 'y' : 181.48},  186 : {'x' : 40.99, 'y' : 192.84},
                  187 : {'x' : 0.00, 'y' : 197.15},   188 : {'x' : -37.62, 'y' : 193.53},
                  189 : {'x' : -73.85, 'y' : 182.79}, 190 : {'x' : -107.38, 'y' : 165.34},
                  191 : {'x' : -139.41, 'y' : 139.41},        192 : {'x' : -163.44, 'y' : 110.25},
                  193 : {'x' : -181.48, 'y' : 77.03}, 194 : {'x' : -192.84, 'y' : 40.99},
                  195 : {'x' : -197.15, 'y' : 0.00},  196 : {'x' : -193.53, 'y' : -37.62},
                  197 : {'x' : -182.79, 'y' : -73.85},        198 : {'x' : -165.34, 'y' : -107.38},
                  199 : {'x' : -139.41, 'y' : -139.41},       200 : {'x' : -110.25, 'y' : -163.44},
                  201 : {'x' : -77.03, 'y' : -181.48},        202 : {'x' : -40.99, 'y' : -192.84},
                  203 : {'x' : -0.00, 'y' : -197.15}, 204 : {'x' : 37.62, 'y' : -193.53},
                  205 : {'x' : 73.85, 'y' : -182.79}, 206 : {'x' : 107.38, 'y' : -165.34},
                  207 : {'x' : 139.41, 'y' : -139.41},        208 : {'x' : 163.44, 'y' : -110.25},
                  209 : {'x' : 181.48, 'y' : -77.03}, 210 : {'x' : 192.84, 'y' : -40.99},
                  211 : {'x' : -197.15, 'y' : 0.00},  212 : {'x' : -193.53, 'y' : 37.62},
                  213 : {'x' : -182.79, 'y' : 73.85}, 214 : {'x' : -165.34, 'y' : 107.38},
                  215 : {'x' : -139.41, 'y' : 139.41},        216 : {'x' : -110.25, 'y' : 163.44},
                  217 : {'x' : -77.03, 'y' : 181.48}, 218 : {'x' : -40.99, 'y' : 192.84},
                  219 : {'x' : -0.00, 'y' : 197.15},  220 : {'x' : 37.62, 'y' : 193.53},
                  221 : {'x' : 73.85, 'y' : 182.79},  222 : {'x' : 107.38, 'y' : 165.34},
                  223 : {'x' : 139.41, 'y' : 139.41}, 224 : {'x' : 163.44, 'y' : 110.25},
                  225 : {'x' : 181.48, 'y' : 77.03},  226 : {'x' : 192.84, 'y' : 40.99},
                  227 : {'x' : 197.15, 'y' : 0.00},   228 : {'x' : 193.53, 'y' : -37.62},
                  229 : {'x' : 182.79, 'y' : -73.85}, 230 : {'x' : 165.34, 'y' : -107.38},
                  231 : {'x' : 139.41, 'y' : -139.41},        232 : {'x' : 110.25, 'y' : -163.44},
                  233 : {'x' : 77.03, 'y' : -181.48}, 234 : {'x' : 40.99, 'y' : -192.84},
                  235 : {'x' : 0.00, 'y' : -197.15},  236 : {'x' : -37.62, 'y' : -193.53},
                  237 : {'x' : -73.85, 'y' : -182.79},        238 : {'x' : -107.38, 'y' : -165.34},
                  239 : {'x' : -139.41, 'y' : -139.41},       240 : {'x' : -163.44, 'y' : -110.25},
                  241 : {'x' : -181.48, 'y' : -77.03},        242 : {'x' : -192.84, 'y' : -40.99},
              };

function ExtractChannelWaveforms(data, whichs2, hidelist){
    // Extract channel waveforms from dict and return in dygraph format   
      // where first element [0] is channel number              
    
    var retarray = [];
    
    // Do the first element                                                        
    var line = [];
    for (var key in data['s2s'][whichs2]['channel_waveforms'])
          line.push(key);
    retarray.push(line);
      for(channel = 0; channel<line.length; channel+=1){
          if(hidelist.length != 0 && $.inArray(line[channel], hidelist) != -1)
              continue;
          element = 1;
          for(index = 0; index<data['s2s'][whichs2]['channel_waveforms'][line[channel]].length;
              index+=1){
              if(data['s2s'][whichs2]['channel_waveforms'][line[channel]][index] == 'z'){
                  nzeros = parseInt(data['s2s'][whichs2]['channel_waveforms'][line[channel]][index+1]);
                  for(j=0;j<nzeros;j++){
                      if(retarray.length<element+1){
                          retarray.push([0.]);
                          element+=1;
                      }
                      else {
                          retarray[element].push(0.);
                          element+=1;
                      }
                  }
                  index+=1;
                  continue;
              }
	      else{
                  if(retarray.length<element+1){
                      retarray.push([parseFloat(data['s2s'][whichs2]['channel_waveforms'][line[channel]][index])]);
                      element+=1;
                  }
                  else{
                      retarray[element].push(parseFloat(data['s2s'][whichs2]['channel_waveforms'][line[channel]][index]));
                      element+=1;
                  }
              }
	      
          } // end for through this packed data  
      } // end for through channels     
    return retarray;
}

function emo_draw_waveform(div, data){
    xaxis = [];
    var tpc_index = -1;
    waveforms = UnzipWaveforms(data, 1);

    tpc_max = Math.max.apply(null,waveforms['tpc']);
    tpc_min = Math.min.apply(null, waveforms['tpc']);
    veto_max = Math.max.apply(null,waveforms['veto']);
    veto_min = Math.min.apply(null, waveforms['veto']);
    var waveform_max = tpc_max;
    var waveform_min = tpc_min;
    if(veto_max>tpc_max) waveform_max = veto_max;
    if(veto_min < tpc_min) waveform_min = veto_min;
  

        var trace_tpc = {
            x: waveforms['x'],
            y: waveforms['tpc'],
            mode: 'lines',
        //    xaxis: 'x',
            yaxis: 'y2',
            name: "TPC Sum",
            line: {'color': '#5992c2'}
        };
    var trace_veto = {
        x: waveforms['x'],
        y: waveforms['veto'],
        mode: 'lines',
  //      xaxis: 'x',
	yaxis: 'y2',
        name: "Veto",
        line: {'color': '#ff4040'}

    };

    plot_data = [trace_veto, trace_tpc];

    // hits plot
    scatter_data = {x:[], y:[], left: [], right: []};
    for(var x=0;x<data['all_hits'].length;x+=1){
        scatter_data['x'].push(data['all_hits'][x]['index_of_maximum']);
        scatter_data['y'].push(data['all_hits'][x]['channel']);
        scatter_data['left'].push(data['all_hits'][x]['index_of_maximum'] - data['all_hits'][x]['left']);
        scatter_data['right'].push(data['all_hits'][x]['right'] - data['all_hits'][x]['index_of_maximum']);


    }
     var trace = {
            y: scatter_data['y'], //data['all_hits'][x]['channel'],
            //x: [data['all_hits'][x]['left'], data['all_hits'][x]['right']],
            x: scatter_data['x'],//data['all_hits'][x]['index_of_maximum'],
            type: 'scatter',
            mode: "markers",
            name: "All hits",
            marker: { symbol: 1, color: "red", opacity: 0.5,
            },
            error_x: {
              type: "array",
                visible: true,
                symmetric: false,
                array: scatter_data['right'],
                color: "#333333",
                thickness: 1,
                arrayminus: scatter_data['left'],
            },
            xaxis: 'x',
//            yaxis: 'y2',
            //name: "Channel " + data['all_hits'][x]['channel'].toString(),
        };
    plot_data.push(trace);
    
    // Now add annotaions for all S1/S2 peaks
    peaks_s2 = get_peaks(data, 's2');
    peaks_s1 = get_peaks(data, 's1');
    annos = [];
    shapes = [];
    for( var s2=0;s2<peaks_s2.length;s2+=1){
	peak = data['peaks'][peaks_s2[s2]];
	anno = {		
	    x:peak['index_of_maximum'],
	    y:waveforms['tpc'][peak['index_of_maximum']],
	    xref:'x',
	    yref:'y2',
	    text:'S2['+s2.toString()+']',
	    showarrow:true,
	    arrowhead:7,
	    ax:0,
	    ay:-40
	};
	annos.push(anno);
	shape =    {
	    type: 'rect',
	    // x-reference is assigned to the x-values
	    xref: 'x',
	    // y-reference is assigned to the plot paper [0,1]
	    yref: 'paper',
	    x0: peak['left'],
	    y0: 0,
	    x1: peak['right'],
	    y1: 1.05*waveform_max,
	    fillcolor: '#4fa783',
	    opacity: 0.2,
	    line: {
		width: 1,
		opacity: 0.4
	    }
	};
	shapes.push(shape);
    };
    for( var s1=0;s1<peaks_s1.length;s1+=1){
	peak = data['peaks'][peaks_s1[s1]];
	anno = {
	    x:peak['index_of_maximum'],
	    y:waveforms['tpc'][peak['index_of_maximum']],
	    xref:'x',
	    yref:'y2',
	    text:'S1['+s1.toString()+']',
	    showarrow:true,
	    arrowhead:7,
	    ax:0,
	    ay:-40
	};
	annos.push(anno);
	shape =    {
	    type: 'rect',
	    // x-reference is assigned to the x-values
	    xref: 'x',
	    // y-reference is assigned to the plot paper [0,1]
	    yref: 'paper',
	    x0: peak['left'],
	    y0: 0,
	    x1: peak['right'],
	    y1: 1.05*waveform_max,
	    fillcolor: '#b342b4',
	    opacity: 0.2,
	    line: {
		width: 1,
		opacity: 0.4
	    }
	};
	shapes.push(shape);
    };

    wmin = 2*waveform_min;
    wmax = 1.05*waveform_max;
    
    var layout = {	
        xaxis: {tickformat:"f", anchor: 'y', title: "Samples [10ns]"}, //domain: [0, 0.45]},
        yaxis: {domain: [0, 0.5], title: "PMT channel", range: [0, 255]},
        yaxis2: {domain: [0.5,1.], title: "Charge [p.e.]", range: [wmin,wmax], autorange: false,},
        margin: {l:50, r:0, t:0, b:40},
	annotations: annos,
	shapes: shapes,
//	hovermode: 'y',
    };

    
    Plotly.newPlot(div, plot_data, layout, {"showLink": false, "displaylogo": false});


    //var trace1 = {
    //    x: [1, 2, 3],
    //    y: [4, 5, 6],
    //    type: 'scatter'
    //};
}

function UnzipWaveforms(data, format){
    // Unzip compressed waveforms and put the sum and filtered into one dict 
    // Return value is this dict 
    var veto_waveform = [];
    var tpc_waveform = [];

    // Get veto and sum waveforms
    var idx_veto = -1;
    var idx_tpc  = -1;
    for( i=0; i<data['sum_waveforms'].length; i+=1){
        if(data['sum_waveforms'][i]['name'] == 'veto_raw')
            idx_veto = i;
        else if(data['sum_waveforms'][i]['name'] == 'tpc_raw')
            idx_tpc = i;
    }
    if( idx_veto < 0 || idx_tpc < 0 )
        return;
    //bottleneck is transfer. so use browser to decompress waveform
    for(i=0;i<data['sum_waveforms'][idx_veto]['samples'].length;i++){
        if(data['sum_waveforms'][idx_veto]['samples'][i]=="z"){
            nzeros=parseInt(data['sum_waveforms'][idx_veto]['samples'][i+1]);
            for(j=0;j<nzeros;j++)
                veto_waveform.push(0.);
            i=i+1;
            continue;
        }
        else
            veto_waveform.push(parseFloat(data['sum_waveforms'][idx_veto]['samples'][i]));
    }
    for(i=0; i<data['sum_waveforms'][idx_tpc]['samples'].length;i++){
        if(data['sum_waveforms'][idx_tpc]['samples'][i]=="z"){
            nzeros = parseInt(data['sum_waveforms'][idx_tpc]['samples'][i+1]);
            for(j=0; j<nzeros; j++)
                tpc_waveform.push(0.);
            i=i+1;
            continue;
        }
        else
            tpc_waveform.push(parseFloat(data['sum_waveforms'][idx_tpc]['samples'][i]));
    }

    // Put together
    var total_data;
    if(format==1)
        total_data = {"x":[], "tpc": [], "veto": []};//[];
    else
        total_data = [];
    for(i=0;i<tpc_waveform.length;i++) {
        if (i < veto_waveform.length) {
            if(format==0) {
                total_data.push([i, tpc_waveform[i], veto_waveform[i]]);
            }
            if(format==1) {
                total_data['x'].push(i);
                total_data['tpc'].push(tpc_waveform[i]);
                total_data['veto'].push(veto_waveform[i]);
            }
        }
    }
    return total_data;
}

function draw_full_waveform( div, unzipped_data, height ){
    
    draw_waveform( div, unzipped_data, "", height );
}

function get_peaks(data, peaktype){
    peaks = [];
    for(x=0;x<data['peaks'].length;x+=1){
        if( data['peaks'][x]['type'] != peaktype)
            continue;
        if(peaks.length == 0 )
            peaks.push(x);
        else{
	    size = peaks.length;
            for(index=0;index<peaks.length;index+=1){		
                if(peaktype=='s1' &&
                    data['peaks'][x]['n_contributing_channels'] > 
		   data['peaks'][peaks[index]]['n_contributing_channels']) {
                    peaks.splice(index, 0, x);
                    break;
                }
                else if(peaktype=='s2' &&
			data['peaks'][x]['area'] > 
			data['peaks'][peaks[index]]['area']){
                    peaks.splice(index, 0, x);
                    break;
                }
            }
	    if(size == peaks.length) peaks.push(x);
        }
    }
    return peaks;
}
function getNPeaks(data, type){
    if(type!='s1' && type!='s2')
	return 0;
    var count = 0;
    for( i=0; i<data['peaks'].length; i+=1 ){
	if( data['peaks'][i]['type'] == type )
	    count += 1;
    }
    return count;
}
function draw_peak( div, data, unzipped_data, ID, peaktype, title, callback ){
    
    // Check for invalid peak types
    if( peaktype != 's1' && peaktype != 's2' ){
	console.log(" tpc_3d::draw_peak ERROR unknown peak type " + peaktype );
	return;
    }

    // Get list of s1 indices (by coinc) or s2s (by area)
    var peaks = get_peaks(data, peaktype);

    // Check that the S1 is there
    if( peaks.length < ID+1 ){
        console.log(peaks);
	console.log( "tpc_3d::draw_d1 - ERROR requested S1 out of bounds");
	return;
    }
    
    // Compute boundaries
    leftb = data['peaks'][peaks[ID]]['left'];
    rightb = data['peaks'][peaks[ID]]['right'];
    buffer = Math.ceil( .1*( rightb - leftb ));
    leftb = leftb - buffer;
    if( leftb < 0 ) leftb = 0;
    rightb = rightb + buffer;
    if( rightb > unzipped_data.length ) rightb = unzipped_data.length;
    
    // Slice the waveform around the S1
    waveform = unzipped_data.slice( leftb, rightb );

    // From here for plotly plot

    // Sum waveform trace
    sum_x = [];
    sum_y = [];
    for(var x=0;x<waveform.length;x+=1){
	sum_x.push(leftb+x);
	sum_y.push(waveform[x][1]);
    }
    plot_data = [];
    trace_sum = {
	x: sum_x,
	y: sum_y,
	mode: 'lines',
	color: "#5992c2",
	name: "Sum waveform"
    };
//    plot_data.push(trace_sum);
    for(var h=0;h<data['peaks'][peaks[ID]]['hits'].length;h+=1){
	var pulse = data['pulses'][data['peaks'][peaks[ID]]['hits'][h]['found_in_pulse']];
	sum_x = [];
	sum_y = [];
	for(var x=0;x<pulse['raw_data'].length;x+=1){
	    sum_x.push(pulse['left']+x);
	    sum_y.push((16000-pulse['raw_data'][x])-pulse['baseline']);
	}
	var trace = {
	    'hoverinfo': 'none',
	    x: sum_x,
	    y: sum_y,
	    mode: 'lines',
	    name: "Channel " + pulse['channel'].toString(),
	    line: {"width": 1},
	};
	plot_data.push(trace);
	
    }
    layout={
	'showlegend': false,
	'xaxis': {
	    'autorange': false,
	    'range': [leftb, rightb],
	    'tickformat':"f",
	},
	'margin': {
	    l:30, r:0, t:30, b:20,
	},  
    };
    Plotly.newPlot(div, plot_data, layout, {'showLink':false, 'displaylogo':false}, callback());
    // End plotly plot

    // Uncomment for Dygraphs plot
    //draw_waveform( div, waveform, title, 320 );
}

function draw_waveform( div, thedata, thetitle, height ){
    
    graph = new Dygraph( div, thedata, 
			 { 
			     legend: "never",
			     labelsDivWidth: 0,
			     axisLabelColor: "#AAAAAA",
			     axisLineColor: "#AAAAAA",
			     title: thetitle,
			     showRoller: false,
			     rollPeriod: 1,
			     strokeWidth: 2,
			     labels: ["bin (10ns)", "sum_waveform", "filtered_waveform"],
			     //ylabel: "",
			   //  xlabel: "bin (10ns)",
			     colors: ['#5992c2', '#ff0202'], //'#09E042'],
                 height: height,
                      });
}

function draw_hit_location( scene, data, hit_locs )
// Draw a little circle at hit location
{
    var imm_to_threejs = 10.;
    peaks = get_peaks(data, 's2');
    if(peaks.length != 0){
        posx = data['peaks'][peaks[0]]['reconstructed_positions'][0]['x']*imm_to_threejs*-1;  // -1 to get geometry right
        posz = data['peaks'][peaks[0]]['reconstructed_positions'][0]['y']*imm_to_threejs;
    }
    else
        return;
    // Right now we have no z position so set random y
    posy = Math.random() * 1000 + 100;

    if( hit_locs.length > 100 ){
	scene.remove( hit_locs[0] );
	hit_locs.shift();
    }

    // Modify most recent to make smaller
    if( hit_locs.length > 0 ){
	
	hit_locs[ hit_locs.length -1 ].scale.x = .5;
	hit_locs[ hit_locs.length -1 ].scale.y = .5;
	hit_locs[ hit_locs.length -1 ].scale.z = .5;
    }

    var hit_marker = new THREE.Mesh( new THREE.SphereGeometry( 15, 8, 6 ),
				     new THREE.MeshLambertMaterial( { color: 0xffffff} ) 
				   ) ;
    hit_marker.overdraw = true;
    hit_marker.position.x = posx;
    hit_marker.position.y = posy;
    hit_marker.position.z = posz;
    
    hit_locs.push( hit_marker );
    scene.add( hit_marker );    
}

function draw_hitpattern( scene, camera, renderer, hits, data, type, index )
// Draw the hit pattern
{
    logstr = "Drawing peak type " + type + " at index " + index.toString();
    console.log(logstr);
    var iScaleMultiplier = 2.5;
    var iPositionTopArray = 1050;
    var iPositionBottomArray = -150;
    var iPmtHeightCorrection = 500;
    var iPmtSpeedFactor = 15;

    // Clear hits array first
    for ( x=0; x<hits.length; x++ ){	
	scene.remove( hits[x] );
    }
    hits.length = 0;
    
    // This will hold the heights, which
    cylinder_heights = [];

    peaks = get_peaks(data, type);
    if(peaks.length == 0 || data['peaks'].length < peaks[index]){
	console.log("Out of index peak");
        return;
    }
    console.log(peaks);
    console.log(data);
    var maxamp = 0.;
    for(x=0;x<data['peaks'][peaks[index]]['area_per_channel'].length;x+=1) {
	if(data['peaks'][peaks[index]]['area_per_channel'][x]>maxamp)
	    maxamp = data['peaks'][peaks[index]]['area_per_channel'][x];
    }
    // Loop through hits and define 'pmt' size and color
//    for(x=0;x<data['peaks'][peaks[index]]['hits'].length;x++){
    for(x=0;x<data['peaks'][peaks[index]]['area_per_channel'].length;x+=1) {
        // This makes a RELATIVE amplitude (height of pmt
        // is only determined by other hits in S2)
//	amp = data['peaks'][peaks[index]]['hits'][x]['area']/data['peaks'][peaks[index]]['area'];
        amp = data['peaks'][peaks[index]]['area_per_channel'][x] / maxamp;
        //data['peaks'][peaks[index]]['area'];
        channel = x;//parseInt(data['peaks'][peaks[index]]['hits'][x]['channel']);
        //amp *= 20;
        //console.log(x.toLocaleString() + amp.toString());
        //if( amp == 0. ) amp = 0.01;
        if (amp > 1.) amp = 1.;
	colz = GetColor( amp ); 
	

        var hit = new THREE.Mesh(new THREE.CylinderGeometry(35, 35, 0),
				 new THREE.MeshLambertMaterial({color: 0xffff00}));
	hit.material.color.setRGB(colz[0], colz[1], colz[2]);
	hit.material.emissive.setRGB(colz[0], colz[1], colz[2] );
        hit.name=x.toString();
	hit['area']=data['peaks'][peaks[index]]['area_per_channel'][x].toFixed(2);
        hit.callback = function() {
            console.log(this.name);
        };

    //console.log("amp");
	//console.log(amp);
	// The color will be determined such that the largest hit is 
	// at the 'top' of the pallete and the smallest should be at the bottom
	//colz = GetColor( amp ); ///data['peaks'][peaks[0]]['hits'][0]['area']);
	if(amp == 0.) amp = 0.01;
	// Set color

	//hit.material.color.setRGB( colz[0],
        //                           colz[1],
        //                           colz[2] );

	// Make it glow
        //hit.material.emissive.setRGB(colz[0],
        //                             colz[1],
        //                             colz[2] );

	// Look up what this does
	hit.overdraw = true;

	hit.position.x = g_pmt_map[channel]['x']*iScaleMultiplier;
        hit.position.z = g_pmt_map[channel]['y']*iScaleMultiplier;
	
	// Draw at proper y position
	if( channel <= 98 )
	    hit.position.y = iPositionTopArray;
	else
	    hit.position.y = iPositionBottomArray;

	hits.push( hit );
	cylinder_heights.push( iPmtHeightCorrection * amp );

	scene.add( hit );
    } //end loop through hits

    // If you want all PMTs represented
    /*for( x=0; x< data['peaks'][peaks[index]]['area_per_channel'].length; x++){
	if(x>242) continue;
	if(data['peaks'][peaks[index]]['area_per_channel'][x]!=0.)
	    continue;
        //console.log(x);
        var hit = new THREE.Mesh(new THREE.CylinderGeometry(35,35,0),
				 new THREE.MeshLambertMaterial({color:0xffff00}));
	    colz = GetColor( 0. ); ///data['peaks'][peaks[0]]['hits'][0]['area']);

	    // Set color
	console.log(colz);
	hit.material.color.setRGB( colz[0], colz[1], colz[2] );
	// Make it glow
        //hit.material.emissive.setRGB(colz[0], colz[1], colz[2] );
	    // Look up what this does
	    hit.overdraw = true;
	    hit.position.x = g_pmt_map[x.toString()]['x']*iScaleMultiplier;
        hit.position.z = g_pmt_map[x.toString()]['y']*iScaleMultiplier;

	    // Draw at proper y position
	    if( x.toString() <= 98 || (x.toString() >= 179 && x.toString()<=210) )
	        hit.position.y = iPositionTopArray;
	    else
	        hit.position.y = iPositionBottomArray;

	    hits.push( hit );
	    cylinder_heights.push( iPmtHeightCorrection *.0001 );

	    scene.add( hit );
    }
    */
    // Now to actually animate the thing
    var currentLen = 0;

    function hitsAnimation(){
	
	// Set to true once all hits set to proper size
	var oneHitStillGoing = false;
	currentLen += iPmtSpeedFactor;
	
	// Loop through hits and adjust height as needed
	for( x = 0; x < hits.length; x++ ){

	    if( currentLen < cylinder_heights[x] ){
		oneHitStillGoing = true;
		
		// The only way to update cylinder height is actually
		// to remove the old cylinder and draw a new one
		scene.remove( hits[x] );
		hits[x].geometry = new THREE.CylinderGeometry( 35, 35, currentLen );
		scene.add( hits[x] );
	    }
	}

	if( oneHitStillGoing ) {
	    renderer.render( scene, camera );
	    requestAnimationFrame( hitsAnimation );
	}
	else
	    return;
    }
    
    // Call the animation function
    requestAnimationFrame( hitsAnimation );
}

function initialize_mini_display(scene, camera, renderer, path, div, callback){
    
    var VIEW_ANGLE = 90;
    var NEAR = .1;
    var FAR = 10000;
    var WIDTH = document.getElementById(div).offsetWidth;
    var HEIGHT = document.getElementById(div).offsetHeight;
    console.log(WIDTH);
    var ASPECT = WIDTH/HEIGHT;

    //renderer = new THREE.WebGLRenderer({blending: THREE.AdditiveBlending, 
//					alpha: true});
    renderer.setClearColor(0xFFFFFF, 1);

  //  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    //scene = new THREE.Scene();
    scene.add(camera);
    //top -6.959373219186038e-7 y: 374.98352966332897 z: -0.00012501453329469885
    // bottom X: 2.934827825723431e-7 y: 529.7322777457862 z: -0.00002973082924860163
    //X: -447, Y: 754, Z: -1208 FRONT
    camera.position.z = 0;//-1124;
    camera.position.y = 375;//1089;//989;//1400;//989;
    camera.position.x = 0;

    // set the size
    renderer.setSize(WIDTH, HEIGHT);

    // attach renderer's DOM element to container
    var $div = $("#"+div);
    $div.append(renderer.domElement);
    
    //draw_simple_cylinder(scene,camera,renderer,function(){});
    //callback();
    draw_tpc(scene, camera, renderer, path, callback, "", 0x444444);
 
}
function draw_simple_cylinder(scene, camera, renderer, callback){

    var outline = new THREE.Mesh(new THREE.CylinderGeometry(550,550,1300),
				 new THREE.MeshBasicMaterial( { wireframe: true, opacity: 0.5 } ));
    scene.add(outline);
    outline.position.y = 485;
    callback();

}
function draw_tpc(scene, camera, renderer, path, callback, callback_arg, color)
//This is the main animation function
//It is responsible for drawing the main animation loop
// Do not confuse this with MakeAnimation below, which draws the electron cartoon
{
    if(color == 'undefined') color = '0x2194ce';
    loader = new THREE.JSONLoader();
    loader.load( path, 
		 function (geometry, materials){
		     loaded=true;
		    /*      
			    // This is for the "metal looking" TPC
			    var TPC_Material = new THREE.MeshPhongMaterial( {  
			    emissive: 0x111111,
                            transparent: true,
                            opacity: 0.2,
			    shininess: 50,
			    ambient: 0x404040,
			    color: 0xf0f0f0,
			    specular: 0xf0f0f0,
			    metal: true,
			    shading: THREE.flatShading,
			    });                                                                            */
		     var TPC_Material = new THREE.MeshBasicMaterial( {
			 wireframe: true,
			 wireframeLinewidth: 1,//.8,
                         color: color,
			 //        color: 0x144c69,
			 transparent: true,
			 opacity: 0.05,
			 vertexColors: THREE.NoColors,
			 //shading: THREE.smoothShading,
		     });

		    mesh = new THREE.Mesh(geometry, TPC_Material);
		    mesh.geometry.computeFaceNormals();
		    mesh.geometry.computeVertexNormals();
		    scene.add(mesh);
		    mesh.position.y = 750;
             callback(callback_arg);
		}); // end load function
}

function GetV(seed){
    // seed is between 0 and 1. This returns a random 
    // number with magnitude at least 5                                                                        
      absval = (12.*seed - 6.)*12.;
      if(absval<0)
          absval-=5.;
      if(absval>=0)
          absval+=5.;
      return absval;
}

function GetColor( amp )
{
    var colz = [ 0, 0, 0];
    if(amp == 0.) return [200,200,200];
    //amp *= 30;
    // CONSTANTS

    //amp*=50;
    //console.log("Color amp");
    //console.log(amp);
    var m_r = 434;
    var offset_r = -217;

    // col_g ==217 at .5, 35 at 0, 1
    var col_g = (Math.abs(.5-amp)) * 217;
    //var m_g = 55;
    //var offset_g = 0;

    //var m_b = 55;
//    var offset_b = 0;
    var col_b = (Math.abs(1.-amp))*434 - 217;

      var col_r = amp * m_r + offset_r;
    //var col_g = 155-(amp * m_g + offset_g);
    //var col_b = 155-(amp * m_b + offset_b);

    if( col_r < 35 ) col_r = 35;
    if( col_r > 217 ) col_r = 217;
    if( col_g < 35 ) col_g = 35;
    if( col_g > 217 ) col_g = 217;
    if( col_b < 35 ) col_b = 35;
    if( col_b > 217 ) col_b = 217;

    col_b =   150 * Math.sin(3.14*amp);//( 1.0 + Math.sin( 6.3*amp ) )/2;
    col_g =  150 * (1.-Math.cos(3.14*amp));//( 1.0 + Math.cos( 6.3*amp ) )/2;
    col_r =   150 * ( 1.0 - Math.sin( 3.14*amp ) );///2;

    colz[0] = col_r / 255.;
    colz[1] = col_g / 255.;
    colz[2] = col_b / 255.;

//    colz[0] =  (.2 + Math.sin( amp )/2);// /2;
//    colz[1] =  (.2 + Math.cos( amp )/2);// /2;
//    colz[2] =  (.7 - Math.sin( amp )/2);// /2;
    console.log(colz);
    return colz;
}

function DrawMouseover( mousex, mousey, threeScene, threeCamera, currentHighlight ){
/*

  Does the color change animation and popup on mouseover for PMT arrays. 

*/

    var vector = new THREE.Vector3(mousex, mousey, 1);
    // not finished see:
}

function MakeAnimation(xv, yv, zv, s1, s2, threeScene, threeCamera, threeRenderer, options, callback, el){
    /*
      Makes a TPC animation including photons and drifting e-

      xv, yv, zv define the interaction vertex
      s1 and s2 are the amplitudes of s1 and s2 in PE

      the scene, camera, and renderer should have already been declared in the calling function

      options is a dict. 
      
     */

    if(options['audio']){
	document.getElementById(options['s1_audioDiv']).load();
	document.getElementById(options['s2_audioDiv']).load();
    }

    // Keep track of how many times a photon bounces
    var nbounces = [];

    // Keep track of if an electron was photonized
    var photonized = [];

    // Create geometry and materials for electrons and photons
    var photons = new THREE.Geometry();
    var electrons = new THREE.Geometry();

    // attributes
    /*var attributes = {
        //alpha: { type: 'f', value: [] },
    };
    // uniforms
    var uniforms = {
        color: { type: "c", value: new THREE.Color( 0xaaffff ) },
	alpha: { type: 'f', value: .6 },
	texture: { type: "t", value: THREE.ImageUtils.loadTexture( options['imagepath'] )},
    };

    // point cloud material
    var p_material = new THREE.ShaderMaterial( {
        uniforms:       uniforms,
        attributes:     attributes,
        vertexShader:   vertexShader,
        fragmentShader: fragmentShader,
        transparent:    true
	
    });*/
    var p_material = new THREE.PointCloudMaterial({
	color: 0xAAFFFF,
	size: 3,
	opacity: 0.3,
	map: THREE.ImageUtils.loadTexture( options['imagepath']),
//	    "{{STATIC_URL}}images/particle_1.png"),
	blending: THREE.AdditiveBlending,
//	transparent: true,
    });
  //  p_material.color.setHSL( Math.random(), 0.9, 0.7);
    
    var e_material = new THREE.PointCloudMaterial({
	color: 0xFFFFFF,
	size: 40,
	opacity: 0.3,
	map: THREE.ImageUtils.loadTexture( options['imagepath'] ),
//	    "{{STATIC_URL}}images/particle_1.png"),
	blending: THREE.AdditiveBlending,
//	transparent: true,
    });
//    e_material.color.setHSL( Math.random(), 0.9, 0.7 );

    // Decide how many photons and electrons should be created
    var n_electrons = options['electrons_s2'];
    var n_photons   = options['photons_s1'];
    if ( options['dynamic_s1s2'] ){
	// In this case n_electrons and n_photons is the max
	// Give for example largest s2=1000 largest s1=100
	n_electrons = n_electrons*Math.ceil(s2/1000.);	
	n_photons   = n_photons*Math.ceil(s1/100.);
	
	// Don't kill my browser!
	if( n_electrons > 30 ){
	    n_electrons = 30;
	    n_photons = n_electrons*options['pe_electron']
	}
	
	// However must have at least n_pe*n_electrons photons
	if(options['pe_electron']*n_electrons > n_photons)
	    n_photons = options['pe_electron']*n_electrons;
    }

    // Create the initial burst of photons. Give them a random velocity.
    // Cheat a little bit and double the velocity in y-direction (vertical)
    for ( x=0; x<n_photons; x++ ){
	//attributes.alpha.value[ x ] = .1;
	var particle = new THREE.Vector3( xv, yv, zv );
	particle.velocity = new THREE.Vector3( GetV(Math.random()),
					       GetV(Math.random())*4, 
					       GetV(Math.random()) );
	photons.vertices.push(particle);
	nbounces.push(0);
    }

    // Create the drift electrons
    for ( x=0; x<n_electrons; x++ ){ 
	var particle = new THREE.Vector3( xv+(40.*Math.random()-20.),
					  yv+(40.*Math.random()-20.),
					  zv+(40.*Math.random()-20.) );
	particle.velocity = new THREE.Vector3( 0, 10., 0);
	electrons.vertices.push(particle);
	photonized.push(false);
    }
    // Create a light to move along with the electrons and illuminate them
    var electron_light = new THREE.PointLight( 0x888888, 10., 50. );
    electron_light.position.x = xv;
    electron_light.position.y = yv;
    electron_light.position.z = zv;
    threeScene.add(electron_light);

    // Create a lens flare to go with the electron light
    var flareColor = new THREE.Color( 0xffffff );
    flareColor.setHSL( .55, .9, .5 + 0.5 );
    var textureFlare0 = THREE.ImageUtils.loadTexture( options["flaretex0"] );
    var textureFlare2 = THREE.ImageUtils.loadTexture( options["flaretex2"] );
    var textureFlare3 = THREE.ImageUtils.loadTexture( options["flaretex3"] );
    var lensFlare = new THREE.LensFlare( textureFlare0, 700, 0.0, THREE.AdditiveBlending, flareColor );
    lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
    lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
    lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
    lensFlare.add( textureFlare3, 60, 0.6, THREE.AdditiveBlending );
    lensFlare.add( textureFlare3, 70, 0.7, THREE.AdditiveBlending );
    lensFlare.add( textureFlare3, 120,0.9, THREE.AdditiveBlending );
    lensFlare.add( textureFlare3, 70, 1.0, THREE.AdditiveBlending );
    lensFlare.customUpdateCallback = lensFlareUpdateCallback;
    lensFlare.position.copy( electron_light.position );
    scene.add( lensFlare );

    // Create a light to flash at the s1 position
    var s1_light = new THREE.PointLight( 0x888888, 0., 10000. );
    s1_light.position.x = 0;//xv; 
    s1_light.position.y = 400;//yv;
    s1_light.position.z = 0;//zv;
    threeScene.add(s1_light);

    // Define the point cloud systems for e and gammas
    var photon_system = new THREE.PointCloud( photons, p_material );
    photon_system.sortParticles = true;
    //photon_system.scale.set(199, 100, 100);
    var electron_system = new THREE.PointCloud( electrons, e_material );
    electron_system.sortParticles = true;
    //electron_system.scale.set(32,32,1.);
    threeScene.add(photon_system);
    threeScene.add(electron_system);

    // Play s1 torpedo
    if ( options['audio'] )
        document.getElementById(options['s1_audioDiv']).play();
    var photonizeCount = 0;
    var s1_flash_count = 0;
    var s1_fading = false;

    // Make the animation function for the hit
    function animation(){
	
	// Use these bools to decide when animation is finished
	var onePhotonStillGoing = false;
	var oneElectronStillGoing = false; 

	// First move the electrons
	for( x=0; x<electrons.vertices.length; x++ ){
	    
	    var electron = electrons.vertices[x];
	    
	    // if electron hits the gas phase it showers
	    if ( electron.y > 1050 ){
		
		// remove the electron itself from the scene
		electron.velocity.y = 0;
		
		// if it hasn't alhready photonized, do that
		if ( !photonized[x] ){
		    photonized[x] = true;
		    
		    // Can add flash here later if needed
		    
		    // Play sound 
		    if ( photonizeCount == 0 ){
			    if( options['audio'] )
			document.getElementById(options['s2_audioDiv']).play();		    		    
			s1_flash_count = 1;
			photonizeCount+=1;
		    }

		    // Make the photons
		    for ( y=0; y < options['pe_electron']; y++ ){
			
			var newphoton = photons.vertices[ (options['pe_electron'] *x ) + y ];
			newphoton.x = electron.x;
			newphoton.y = electron.y;
			newphoton.z = electron.z;
			newphoton.velocity.x = GetV(Math.random());
			newphoton.velocity.y = GetV(Math.random());
			newphoton.velocity.z = GetV(Math.random());
		    }		    
		}
		electron.y = 150000;

		continue;
	    }
	    
	    // If the electron hasn't reached the top then move it
	    // Also add some spread to the cloud
	    oneElectronStillGoing = true;
	    electron.velocity.y *= 1.02; // accelerate
	    electron.x += Math.random()*20. -10.;
	    electron.z += Math.random()*20. -10.;
	    electron.add(electron.velocity);

	    // put the electron light in the proper place
	    if( x == 0 ){
		electron_light.position.y = electron.y;
		lensFlare.position.copy( electron_light.position );
	    }
	} // end for electrons

	// Make the s1 flash	
	if( s1_flash_count < 99 ){
	 
	    if( s1_fading ){	    
		if ( s1_light.intensity > 0. )
		    s1_light.intensity -= 250.;
		else if ( s1_light.intensity <= 0. && s1_flash_count >= 3){
		    s1_flash_count = 100;
		}
		else if( s1_light.intensity <=0. && s1_flash_count <3){
		    s1_fading = false;
		    s1_flash_count += 1;
		}
	    }
	    else {
		if( s1_light.intensity < 500. )
		    s1_light.intensity += 250;
		else
		    s1_fading = true;
	    }
	}
		    
	    
	// Do photon animation
	for ( x=0; x<photons.vertices.length; x++ ){

	    var photon = photons.vertices[x];
	    
	    // Should bounce around inside TPC
	    if ( Math.sqrt( Math.pow(photon.x, 2) + Math.pow(photon.z, 2)) > 360){
		// speed them up when they bounce (get rid of faster)
		photon.velocity.x *= -1.5;
		photon.velocity.z *= -1.5;
		nbounces[x] += 1;
	    }

	    if ( photon.y > 1200 || photon.y < -50 || nbounces[x] > 2 ){
		photon.velocity = new THREE.Vector3(0., 0., 0.);
		photon.y = 150000;
		continue;
	    }
	    
	    onePhotonStillGoing = true;
	    photon.add(photon.velocity);	    
	}// end for through photon animation

	// Remove electron light from scene if they're not going anymore
	if ( !oneElectronStillGoing ){
	    threeScene.remove(electron_light);
	    threeScene.remove(lensFlare);
/*	    function FadeFlareAnimation(){                                         
                if(lensFlare.opacity <=0){        
                    threeScene.remove(lensFlare);    		    
                    return;                                       
                }       
                lensFlare.opacity -= .01; 
                threeRenderer.render(threeScene, threeCamera); 
                requestAnimationFrame(FadeFlareAnimation); 
            }   
            requestAnimationFrame(FadeFlareAnimation); 
*/
	}
	// Add s2 flash here if wanted
	
	// Clean up scene if everything is done
	if ( !oneElectronStillGoing && !onePhotonStillGoing ){
	    threeScene.remove(photon_system);
	    threeScene.remove(electron_system);
	    threeScene.remove(s1_light);
        callback(el);
	    return;
	}

	// Tell system that vertices are updated
	photon_system.geometry.__dirtyVertices = true;
        electron_system.geometry.__dirtyVertices = true;
	
	// Render
	threeRenderer.render(threeScene,threeCamera);
        requestAnimationFrame(animation);	
    }//end animation function

    requestAnimationFrame(animation);
}



function lensFlareUpdateCallback( object ) {
    var f, fl = object.lensFlares.length;
    var flare;
    var vecX = -object.positionScreen.x * 2;
    var vecY = -object.positionScreen.y * 2;
    for( f = 0; f < fl; f++ ) {
	   flare = object.lensFlares[ f ];
	   flare.x = object.positionScreen.x + vecX * flare.distance;
	   flare.y = object.positionScreen.y + vecY * flare.distance;
	   flare.rotation = 0;
	}
    object.lensFlares[ 2 ].y += 0.025;
    object.lensFlares[ 3 ].rotation = object.positionScreen.x * 0.5 + THREE.Math.degToRad( 45 );
}
