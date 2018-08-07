function ExpanderClick(button) {
    if(button.innerHTML=="Expand")
	button.innerHTML="Hide detail";
    else
	button.innerHTML="Expand";
};

function drawTriggerChart(triggerchart, triggerchartdiv, chart, callback)
{
    // Make dictionary of options
    var chartOptions = {
	exporting: { enabled: false },
        chart : {
            renderTo: triggerchartdiv,
            type: 'area',
            zoomType: 'x',
            animation: {
		easing: 'linear',
            },
            spacingTop: 10,
            spacingLeft: 10,
            spacingRight: 10,
            spacingBottom: 0,
            borderWidth:0,
            borderColor: "#D5D5D5",
        },
	legend: {
	    align: 'left', verticalAlign: 'middle',
	    layout: 'vertical',enabled: false, itemMarginBottom: 5
	},
        credits: {enabled: false},
        title: {text: ''},
        xAxis: {
	    plotLines: [{
		color: '#FF0000', // Red
		width: 2,
		value: 0. // Position, you'll have to translate this to the values on your x axis
	    },
	    {
		color: '#333333',
		width: 2,
		value: 0.
	    }	    ],

            maxPadding:0,
            minPadding:0,
	    min: 0,
	    max: 3600,
            title : { text: 'time in run (s)' },
            //tickInterval: 5000000,                                                                   
            //type: 'datetime',
            labels: {
                enabled: true,
                //formatter: function() {
                  //  var d = new Date();                                                               
                //    return Highcharts.dateFormat('%H:%M', this.value);
            },
        },
        yAxis: [{ // Primary yAxis
            labels: {
		format: '{value}%',
		style: {
                    color: Highcharts.getOptions().colors[3]
		}
            },
            title: {
		text: 'Deadtime',
		style: {
                    color: Highcharts.getOptions().colors[3]
		}
            },
            opposite: true
	    
	}, { // Secondary yAxis
            gridLineWidth: 0,
            title: {
		text: 'Rate',
		style: {
                    color: Highcharts.getOptions().colors[1]
		}
            },
            labels: {
		format: '{value} Hz',
		style: {
                    color: Highcharts.getOptions().colors[1]
		}
            }
	    
	},],
	plotOptions: {
            area: {
                fillColor: null,
                pointPadding: 0,
                borderWidth: 0,
                stacking : false,
                stack : 0,
                marker: {enabled:false},
            },
        },
        series: [],

    }; //end waveform options                                                                           

    triggerchart = new Highcharts.Chart(chartOptions, callback(chart, triggerchart));

}
function updateMongoChart(data, eb0div, eb1div, eb2div){
    drawdivs = [eb0div, eb1div, eb2div];
    for(i=0; i<drawdivs.length; i+=1){
	drawdiv = drawdivs[i];
	console.log(drawdiv);
	if( $('#'+drawdiv).is(':empty') ) {
	    //Create chart
	}
    }
}
function updateTriggerChart(data, triggerdiv)
{
    var thetriggerchart=$("#"+triggerdiv).highcharts();

    // Try to catch cases where the chart needs to be redrawn. 
    // (a) If there are no series present
    // (b) If the series is longer than the current data packet
    // (this happens if the run wraps around)
    if(thetriggerchart.series.length==0 || 
      thetriggerchart.series[0]['data'].length > data['deadtimes']['dts'].length ||
      thetriggerchart.series[1]['data'].length > data['eventrates'].length){
	while(thetriggerchart.series.length!=0){
	    thetriggerchart.series[0].remove(true);
	    console.log("Removing series");
	}
	dict = { type: "line", data: data['deadtimes']['dts'], 
		 name: "Deadtime", fillColor: null, yAxis: 0, 
		 color: Highcharts.getOptions().colors[3]};

        thetriggerchart.addSeries(dict, false);

	dict2 = { type: "line", data: data['eventrates'],
                 name: "Rate", fillColor: null, yAxis: 1,
                 color: Highcharts.getOptions().colors[1]};
	thetriggerchart.addSeries(dict2, false);
	thetriggerchart.redraw();
    }
    else{
	// We're just adding points in this case and not re-drawing whole series
	var shift=false;
	if(thetriggerchart.series[0]['data'].length != data['deadtimes']['dts'].length){
	    for(i=thetriggerchart.series[0]['data'].length-1; i<data['deadtimes']['dts'].length; i+=1){
		thetriggerchart.series[0].addPoint(data['deadtimes']['dts'][i],true,shift);
	    }
	}
	if(thetriggerchart.series[1]['data'].length != data['eventrates'].length){
            for(i=thetriggerchart.series[1]['data'].length-1; i<data['eventrates'].length; i+=1){
		thetriggerchart.series[1].addPoint(data['eventrates'][i],false,shift);
	    }
        }
    }
    // Move the lines forward indicating where the trigger is compared to real time
    var axis = thetriggerchart.xAxis[0];
    var line = axis.plotLinesAndBands[0]; // Get a reference to the plotLine
    line.options.value = data['eventbuilder_info']['last_time_searched']/1e9;	
    line.render(); // Render with updated values.
    var line2 = axis.plotLinesAndBands[1];
    line2.options.value = data['eventbuilder_info']['last_pulse_so_far_in_run']/1e9;
    line2.render();

    
		    
}

function updateTriggerWindow(data, thetriggerchart)
{
    updateTriggerChart(data, 'triggerchartdiv');
    updateMongoChart(data, "eb0_chart", "eb1_chart", "eb2_chart");
    document.getElementById("trigger_event_rate").innerHTML=parseFloat(data['rate']).toFixed(2);
    document.getElementById("trigger_last_collection").innerHTML=data['rname']+"("+data['rnumber']+")";
    var tdate = new Date(1000*(parseFloat(data['eventbuilder_info']['time'])));
    var ttime = tdate.getFullYear()+"."+('0'+(1+tdate.getMonth())).slice(-2) +
	"." + ('0'+tdate.getDate()).slice(-2) + " at " + ('0' + tdate.getHours()).slice(-2) + 
	":" + ('0'+tdate.getMinutes()).slice(-2);
    document.getElementById("trigger_time").innerHTML=ttime;
    if(data["deleter_timestamp"]!=null){
        var deldate = new Date((parseInt(data['deleter_timestamp']['$date'])));
        var deltime = deldate.getFullYear() + "." + ('0' + (1 + deldate.getMonth())).slice(-2) + "." +
            ('0' + deldate.getDate()).slice(-2) + " at " + ('0' + deldate.getHours()).slice(-2) + ":" +
            ('0' + deldate.getMinutes()).slice(-2);
        document.getElementById("deleter_update_time").innerHTML=deltime;
    }
    else{
        document.getElementById("deleter_update_time").innerHTML="Not found";
    }
    var docdate = new Date(1000*(parseFloat(data['time'])));
    var doctime = docdate.getFullYear() + "." + ('0' + (1 + docdate.getMonth())).slice(-2) + "." +
        ('0' + docdate.getDate()).slice(-2) + " at " + ('0' + docdate.getHours()).slice(-2) + ":" +
        ('0'+docdate.getMinutes()).slice(-2);
    document.getElementById("mongo_update_time").innerHTML=doctime;
    busy = data['deadtime'];
    document.getElementById("busy_num").innerHTML=(100.*busy).toFixed(2)+"%";
    document.getElementById("busy_num_tot").innerHTML=(data['deadtime_total']*100.).toFixed(2)+"%";
    //document.getElementById("deadtime_run_name").innerHTML=data['deadtime_total'];
    //document.getElementById("busy_tot_progress").innerHTML = 
    //GetGradProgress(data['deadtime_total'], "dead time", 0.1, 0.5, 
    //data['deadtime_total']*100, "%");
    //document.getElementById("busy_progress").innerHTML=GetGradProgress(busy, "dead time", 
    //0.1, 0.5,busy*100, "%");
    //document.getElementById("eb_lag_progress").innerHTML = GetGradProgress(
    //    data['eventbuilder_info']['eventbuilder_queue_size']/10000, "in queue",
    //    0.3, 0.7, data['eventbuilder_info']['eventbuilder_queue_size'], " events");
    //if(data['eventbuilder_info']['working_on_run']==true)
    //document.getElementById("eb_working").innerHTML="Yes";
    //else
    //document.getElementById("eb_working").innerHTML="Nope";
    document.getElementById("eb0_progress").innerHTML=GetMongoDBProgress(
        data['eb0:27000']['storageSize']/1008e9, "in cache ",0.126, 0.7,
        data['eb0:27000']['storageSize']/1e9, "GB");
    document.getElementById("eb1_progress").innerHTML=GetMongoDBProgress(
        data['eb1:27000']['storageSize']/1008e9, "in cache",0.5, 0.7,
        data['eb1:27000']['storageSize']/1e9, "GB");
    document.getElementById("eb2_progress").innerHTML=GetMongoDBProgress(
        data['eb2:27000']['storageSize']/1008e9, "in cache",0.5, 0.7,
        data['eb2:27000']['storageSize']/1e9, "GB");
    var pctarray = [];
    //var staticdir = "{% static "emo/js" %}";
    var staticdir ="";
    pctarray.push(busy);
    pctarray.push(data['eb0:27000']['storageSize']/1000e9);
    pctarray.push(data['eb1:27000']['storageSize']/1000e9);
    pctarray.push(data['eb2:27000']['storageSize']/1000e9);
    pctarray.push(data['eventbuilder_info']['eventbuilder_queue_size']/10000);
    health = GetHealth(pctarray, staticdir, tdate, deldate);
    // document.getElementById("theimage").innerHTML=health['image'];
    document.getElementById("thetext").innerHTML=health['text'];
    //document.getElementById("eb0_collections").innerHTML=data['eb0:27000']['collections'];
    //document.getElementById("eb1_collections").innerHTML=data['eb1:27000']['collections'];
    //document.getElementById("eb2_collections").innerHTML=data['eb2:27000']['collections'];
    //document.getElementById("eb0_docs").innerHTML=data['eb0:27000']['objects'];
    //document.getElementById("eb1_docs").innerHTML=data['eb1:27000']['objects'];
    //document.getElementById("eb2_docs").innerHTML=data['eb2:27000']['objects'];
//    rate_update_counts=0;

}

function drawChart( chart, chartdiv, graphic_var, callback )
// Draws a chart at the chart div
// Only have to call once
{
    // Make dictionary of options
    var units = {"datarate": "MB/s", "bltrate": "blt/s", "cpu": "%CPU","ram": "MB in buffer"};
    var waveformOptions = {
        global: {
            useUTC: false,
            //timezoneOffset: 60,                                                  
        },
	chart : {
            renderTo: chartdiv,
	    //backgroundColor:'rgba(255, 255, 255, 0.1)',
            type: 'area',
            zoomType: 'xy',
            animation: {
                easing: 'linear',
              },
	    spacingTop: 10,
            spacingLeft: 10,
           spacingRight: 10,
            spacingBottom: 10,
        borderWidth:0,
	    borderColor: "#D5D5D5",
        },
	legend: {align: 'left', verticalAlign: 'middle',layout: 'vertical',enabled: true, itemMarginBottom: 5},
        credits: {enabled: false},
        title: {text: ''},
        xAxis: {
            maxPadding:0,
            minPadding:0,
            title : { text: 'time (UTC)' },
            //tickInterval: 5000000,
            type: 'datetime',
            labels: {
                enabled: true,
                formatter: function() {
                  //  var d = new Date();
                    return Highcharts.dateFormat('%H:%M', this.value);//- d.getTimezoneOffset()*60000);
                },
            },
        },
	yAxis : {
            title : {text: 'rate (MB/s)'},
        },
        plotOptions: {
	    line: {
		marker: {enabled: false}
	    },
            area: {
		fillColor: null,
  //                  linearGradient: {
    //                    x1: 0,
//			y1: 0,
  //                      x2: 0,
    //                    y2: 1
      //              },
        //        },          
                pointPadding: 0,
                borderWidth: 0,
                stacking : false,
                stack : 0,
                marker: {enabled:false},		
            },
        },
	series: [],

    }; //end waveform options    
    
    chart = new Highcharts.Chart(waveformOptions, callback(chart));

}

function updateData( chart, updateUrl )
// Once the chart is loaded you can call this to update the data
{
    $.getJSON(updateUrl,function(data){
	var detlist = ['reader0', 'reader1', 'reader2', 'reader3', 'reader4', 'reader5', 'reader6', 'reader7'];
        var idlist = ['reader0', 'reader1', 'reader2', 'reader3', 'reader4', 'reader5', 'reader6', 'reader7'];

        for (x=0; x<detlist.length; x++){
            var shift = false;
            // do progress bar                                                 
            if(data[detlist[x]]!=null && data[detlist[x]].length==2){
                var IDSTR = idlist[x];
                latestRates[IDSTR] = data[detlist[x]][1];
	    }
	    //update chart                                                     
            if(data[detlist[x]]!=null
	       && chart.series[x].xData[chart.series[x].xData.length-1 ]
               != data[detlist[x]][0]){
                if(chart.series[0].xData.length > 2000)
                    shift = true;
                var tdiff = data[detlist[x]][0] - 
		    chart.series[x].xData[chart.series[x].xData.length-1 ];

                if (tdiff<1000) continue;
                if (tdiff<60000){
                    tdiff = tdiff / 1000; // in seconds                        
                    chart.series[x].data[chart.series[x].data.length-1].update(((chart.series[x].yData[chart.series[x].yData.length-1]*tdiff)+data[detlist[x]][1])/(tdiff+1.));
                }
                else
                    chart.series[x].addPoint(data[detlist[x]],true,shift);
            }
        }
    });
};


function loadData( chart, data, callback )
// Loads data from the URL into the chart. 
// Used the first time only
{
    var fillColors = ["rgba(92,184,92,0.2)", "rgba(217,83,79,0.2)",
    "rgba(91,192,222,0.2)", "rgba(240,173,78,0.2)", "rgba(220,133,21,0.2)"];
    var colors = ["#5cb85c","#d9534f", "#5bc0de", "#f0ad4e", "#785223" ];
    
    for( x=0; x<data.length; x++ ){
	var dict = {};
//	if( x< 5 )
  //          dict = {
////		color: colors[x],
//		fillColor: fillColors[x],
//		data: data[x]['data'],
//		name: data[x]['node'],
  //          };
//	else
            dict = { type: "line", data: data[x]['data'], name: data[x]['node'], fillColor: null};
	chart.addSeries(dict, false);
    }
    chart.redraw();
    callback(chart);
}

function ConvertDateUTC(date){
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),  date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
}

function GetTimeString(startdate){
    // Return the time string based on the run's start time
    // also computes how long run has been running in a nice way
    return "...started "+jQuery.timeago(startdate);
    var nowdate = ConvertDateUTC(new Date());
    //startdate = ConvertDateUTC(startdate);
    var diff = nowdate-startdate;
    if(diff<0)
        diff=0;
    var hours = Math.floor(((diff)/1000)/3600);
    diff -= hours*1000*3600;
    var minutes = Math.floor(((diff)/1000)/60);
    diff -= minutes*1000*60;
    var timestring =" for ";
    if(hours != 0){
        timestring += ( hours.toString());
        if(hours==1) timestring+=" hour";
        else timestring+=" hours";
        if(minutes!=0) timestring+=" and ";
        else timestring+=".";
    }
    if(minutes != 0 ){
        if(minutes==1) timestring+="one minute.";
        else
            timestring += ( minutes.toString() + " minutes.");
    }
    if(hours==0 && minutes==0)
        timestring="...just started";
    return timestring;
}
function GetStateHtml(data, index){
    
    if(data['status'].length <= index)
	return "";
    var status = data['status'][index]['state'];
    if(status == "Running")
	return "<span style='color:green;'>running</span>";
    else if(status == "Idle")
	return "<span style='color:orange;'>idle</span>";
    else if(status == "Error")
	return "<span style='color:red;'>crashed!</span>";
    else
	return "<span>thinking</span>";

}

function FillOutRunInfo(det_name, det_data, status_id){
    if(det_data['status'].length <= status_id)
	return;
    var run_name = "";
    var run_mode = "";
    var started_by = "";
    var start_date = "";
    if(det_data['status'][status_id]['state'] == "Running"){	
	var data = det_data['status'][status_id];
	run_name = data['currentRun'];
	started_by = data['startedBy'];
	run_mode = data['mode'];
	start_date = "todo";
    }
    document.getElementById(det_name + "_runname");
}

function GetRateString(rate, unit){
    if(rate < 1. && unit == "MB/s"){
	rate = rate*1000.;	
	return (rate.toFixed(2) + " kB/s");
    }
    else
	return (rate.toFixed(2) + " " + unit);
}
function GetColor(prog){
    if(prog<40)
	return "green";
    if(prog<70)
	return "yellow";
    if(prog<90)
	return "orange";
    return "red";
}
function GetCPURAMDiv(cpu, ram, ramtot){
    cpu_int = Math.floor(cpu);
    ram_int = Math.floor((ram/ramtot)*100);
    html = "<div style='display:table-cell;width:35%;padding:0;'>"+ 
	 "<div style='height:15px;line-height:15px;font-size:10px;width:100%'>"+
	"CPU: "+cpu_int.toString()+"%</div>" + 
	"<div style='height:4px;line-height:4px;width:100%'>"+
	"<div style='background-color:"+GetColor(cpu_int)+";width:"+cpu_int+"%;height:100%;'></div></div>";

    // RAM
    html += "<div style='height:15px;line-height:15px;font-size:10px;width:100%'>"+
        "RAM: "+ram_int.toString()+"%</div>" +
        "<div style='height:4px;line-height:4px;width:100%'>"+
        "<div style='background-color:"+GetColor(ram_int)+";width:"+ram_int+"%;height:100%;'></div></div>";

    html+="</div>";

return html;
}
function GetRateBTLDiv(rate, blt){
    rate_int = Math.floor(100*(rate/90.));
    blt_int = Math.floor(100*(blt/25000));
    if(blt_int==0) blt_int=1;
    if(rate_int==0) rate_int=1;
    if(rate_int>100) rate_int=100;
    if(blt_int>100) blt_int = 100;
    html = "<div style='display:table-cell;width:35%;padding:0;'>"+
         "<div style='height:15px;line-height:15px;font-size:10px;width:100%'>"+
        "Data: "+rate.toString()+" MB/s</div>" +
        "<div style='height:4px;line-height:4px;width:100%'>"+
        "<div style='background-color:"+GetColor(rate_int)+";width:"+rate_int+"%;height:100%;'></div></div>";
    html += "<div style='height:15px;line-height:15px;font-size:10px;width:100%'>"+
        "BLT: "+blt.toString()+" blk/s</div>" +
        "<div style='height:4px;line-height:4px;width:100%'>"+
        "<div style='background-color:"+GetColor(blt_int)+";width:"+blt_int+"%;height:100%;'></div></div>";
    html+="</div>";

return html;


}
function GetElapsedTime(startTimeString){
    startTimeString+="Z";
    var currentDate = new Date().getTime();
    var startDate = Date.parse(startTimeString);
    var seconds = Math.abs(currentDate - startDate)/1000;
    var hours = Math.floor(seconds/3600);
    var minutes = Math.floor((seconds - (hours*3600) ) /60);
    var seconds = seconds - (hours*3600 + minutes*60);
    var hoursString = hours.toString();
    if(hours < 10)
	hoursString = "0"+hoursString;
    return hoursString + ":" + ("0"+minutes.toString()).slice(-2);



}
function UpdateDetectorTextPretty(dataUrl, nodesUrl, tpc_div, mv_div, tpc_title, mv_title, tpc_title_2, mv_title_2, callback){
    var aliases = {"tpc": "TPC", "muon_veto": "Muon Veto"};

    // Get detector and node data
    $.getJSON( dataUrl, function(detector_data){
	var tpc_rate = 0.;
        var muon_veto_rate = 0.;
        $.getJSON( nodesUrl, function(node_data) {
	    var currentTime = new Date().getTime();
            if(node_data.length>0)
                currentTime = new Date(node_data[0]['date']['$date']);
            var nodeInfo = {"tpc": [], "muon_veto": []};

	    // Loop through node data to get total data rate
            for( var node_id = 0; node_id < node_data.length; node_id += 1){

                var docdate = new Date(node_data[node_id]['createdAt']['$date']);
                var update_seconds = Math.round( (currentTime - docdate)/1000 );
                var color = "black";
                if (update_seconds > 60 )
                    color = "#AAAAAA";

		var html_string ="<div style='display:table;max-height:40px;border-width:1px;border-color:#d3d3d3;border-style:solid;width:100%;'>"+
		    "<div style='display:table-cell;height:40px'>"+
		    "<div style='height:15px;font-size:12px;'><strong";
		if(update_seconds > 100)
		    html_string += " style='color:red' title='This node may be timing out!'";

		    html_string += ">"+node_data[node_id]['node']+
		    " ("+update_seconds.toString()+")</strong></div>"+
		    "<div style='height:15px;font-size:12px;'>"+node_data[node_id]['nboards']+" digitizer(s)</div></div>"+
		    GetCPURAMDiv(node_data[node_id]['cpu'], 
				 node_data[node_id]['ram'], 
				 node_data[node_id]['ramtot'])+
		    GetRateBTLDiv(node_data[node_id]['datarate'], 
				  node_data[node_id]['bltrate'])+
		    
		    "</div>";
		    
		if(node_data[node_id]['node']!='reader5'){
                    nodeInfo['tpc'].push(html_string);
                    tpc_rate+=node_data[node_id][graphic_var]
		}
                else{
                    nodeInfo['muon_veto'].push(html_string);
                    muon_veto_rate+=node_data[node_id][graphic_var];
		}
		
            }// End for through nodes
	    var tpcstr="";
	    var mvstr = "";
	    for(var x=0;x<nodeInfo['tpc'].length;x+=1)
		tpcstr+=nodeInfo['tpc'][x];
	    for(var x=0;x<nodeInfo['muon_veto'].length;x+=1)
		mvstr+=nodeInfo['muon_veto'][x];
	    document.getElementById(tpc_div).innerHTML = tpcstr;
	    document.getElementById(mv_div).innerHTML = mvstr;
	    
	   
	// Update general info 	    
	var aliases = {"tpc": "TPC", "muon_veto": "Muon Veto"};
	for ( var status_id = 0; status_id < detector_data['status'].length; 
	      status_id += 1){
	    
	    if(!detector_data['status'][status_id])
		continue;
            // If we have a nicer name to display set it                           
	    var display_name = detector_data['status'][status_id]['detector'];
            var det_name = display_name;
	    if( display_name in aliases)
                display_name = aliases[display_name];

	    var rate = tpc_rate;
	    if(display_name=="Muon Veto")
		rate = muon_veto_rate;

	    var mode = detector_data['status'][status_id]['mode'];
	    if (mode == "None" || detector_data['status'][status_id]['state']=="Idle")
		mode = "";
	    title_str = 
		"<div class='row' style='padding-left:20px;padding-right:18px;'>"+
		"<h3 style='display:inline-block'>"+
		display_name+"</h3>&nbsp;<h4 style='display:inline-block'>"
		+GetStateHtml(detector_data,status_id)+" "+
		GetRateString(rate, "MB/s")+"</h4>"+"</div>";
		//"<h4 class='pull-right' style='display:inline-block;color:#656565'>"+
		//mode+"</h4></div>";
	    	    
	    var title_2_str = "<div class='row'><div class='col-xs-6";
	    
	    if(display_name=="TPC")
		document.getElementById(tpc_title).innerHTML=title_str;
	    else
		document.getElementById(mv_title).innerHTML=title_str;
	    
	    var elapsed_time = "";
	    var run_no = "";
	    var startedBy = "";
	    if(detector_data['status'][status_id]['state']=="Running"){
		elapsed_time = 
		    GetElapsedTime(detector_data['status'][status_id]['startTime']);
		run_no = detector_data['status'][status_id]['currentRun'];
		startedBy = detector_data['status'][status_id]['startedBy'];
	    }
	    

	    // Now for the second title
	    var title_2_str = "<div style='display:table;max-height:40px;border-width:0px;border-color:#d3d3d3;border-style:solid;width:100%;'>"+
		"<div style='display:table-cell;height:40px'>"+
                "<div style='height:15px;font-size:12px;'>"+
		"<strong>Run: </strong>"+run_no+"</div>"+
		"<div style='height:15px;font-size:12px;'>"+
		"<strong>Started by: </strong>"+startedBy+
		"</div></div>"+
		"<div style='display:table-cell;height:40px'>"+
		"<div style='height:15px;font-size:12px;'>"+
		"<strong>Mode: </strong>"+mode+"</div>"+
		"<div style='height:15px;font-size:12px;'>"+
		"<strong>Time: </strong>"+elapsed_time+"</div>"+
		"</div></div></div>";
	    if(display_name=="TPC")
                document.getElementById(tpc_title_2).innerHTML=title_2_str;
            else
                document.getElementById(mv_title_2).innerHTML=title_2_str;

	    
	}
	callback();

	});//end getJSON nodes                 
    });//end getJSON detector

}
function UpdateDetectorTextNew(dataUrl, nodesUrl, div_id, graphic_var, callback){
  
    var units = {"datarate": "MB/s", "bltrate": "blt/s", "cpu": "%CPU","ram": "MB in buffer"};
    var aliases = {"tpc": "TPC", "muon_veto": "Muon Veto"};

    $.getJSON( dataUrl, function(detector_data){

	$.getJSON( nodesUrl, function(node_data) {

	    
	    var currentTime = new Date().getTime();
	    if(node_data.length>0)
		currentTime = new Date(node_data[0]['date']['$date']);
	    var nodeInfo = {"tpc": [], "muon_veto": []};

	    // For now hardcode TPC/MV	    

	    // Put node data in this dictionary
	    tpc_rate = 0.;
	    muon_veto_rate = 0.;
	    for( var node_id = 0; node_id < node_data.length; node_id += 1){
	    
		var docdate = new Date(node_data[node_id]['createdAt']['$date']);
                var update_seconds = Math.round( (currentTime - docdate)/1000 );
                var color = "black";
                if (update_seconds > 30 )
                    color = "#AAAAAA";

		var html_string = "<tr style='color:" + color + "'>" +
		        "<td>" + node_data[node_id]['node'] + "</td>" +
                    "<td>" + node_data[node_id]['runmode'] + "</td>" +
                    "<td>" + node_data[node_id]['nboards']+ "</td>" +
                    "<td>" + node_data[node_id]['bltrate']+ "</td>" +
                    "<td>" + node_data[node_id]['datarate']+ "</td>" +
		    "<td>" + node_data[node_id]['ram']+"/"+node_data[node_id]['ramtot']+ "</td>" +
		    "<td>" + node_data[node_id]['cpu'].toFixed(2)+ "</td>" +
                    "<td>" + update_seconds.toString()+ "</td></tr>";

		if(node_data[node_id]['node']!='reader5'){ // as in 'reader0x'
		    nodeInfo['tpc'].push(html_string);
		    tpc_rate+=node_data[node_id][graphic_var]
		}
		else{
		    nodeInfo['muon_veto'].push(html_string);
		    muon_veto_rate+=node_data[node_id][graphic_var];
		}
		
	    }
	    
	    
	    // Loop through status dict
	    for ( var status_id = 0; status_id < detector_data['status'].length; status_id += 1){

		// If we have a nicer name to display set it
		var display_name = detector_data['status'][status_id]['detector'];
		var det_name = display_name;
		if( display_name in aliases)
		    display_name = aliases[display_name];
		
		if ($('#'+div_id).find('#'+det_name+"_header").length) {
		    var startdate = detector_data['status'][status_id]['startTime'];
		    document.getElementById(det_name+"_status").innerHTML = GetStateHtml(detector_data,status_id);
		    document.getElementById(det_name+"_runname").innerHTML = detector_data['status'][status_id]['currentRun'];
		    document.getElementById(det_name+"_startedby").innerHTML = detector_data['status'][status_id]['startedBy'];
		    document.getElementById(det_name+"_runmode").innerHTML = detector_data['status'][status_id]['mode'];
                    document.getElementById(det_name+"_startdate").innerHTML = startdate;
		    
		    var timestring = "";
		    thedatestring = detector_data['status'][status_id].startTime;
                    //thedatestring = thedatestring.substr(0, thedatestring.length - 1);
		    //thedatestring += "+00:00";

		    startdate = new Date( thedatestring  );
                    if(detector_data['status'][status_id]['state'] == "Running"){
			timestring = GetTimeString( startdate );
			if(det_name == 'tpc')
			    document.getElementById(det_name+"_rate_div").innerHTML = GetRateString(tpc_rate, units[graphic_var]);
			else
			    document.getElementById(det_name+"_rate_div").innerHTML = GetRateString(muon_veto_rate, units[graphic_var]);
		    }
		    else 
			document.getElementById(det_name+"_rate_div").innerHTML="";
		    document.getElementById(det_name+"_timestring_div").innerHTML = timestring;			
		    
		    

		    var appstring = "";
		    for(var index=0;index<nodeInfo[det_name].length;index+=1){
			appstring+=nodeInfo[det_name][index];
			
		    }
		    document.getElementById(det_name+"_node_div").innerHTML = appstring;
		}
		else{ // append a new header
		    var timestring="";
		    if(detector_data['status'][status_id].startTime!=""){
			thedatestring = detector_data['status'][status_id].startTime;
			//thedatestring = thedatestring.substr(0, 
			//thedatestring.length - 
			//1);
			//thedatestring += "+01:00";
			
			startdate = new Date( thedatestring );
			if(detector_data['status'][status_id]['state'] == "Running")
			    timestring = GetTimeString( startdate );
			else
			    timestring = "";
		    }
		    html_str = "<div class='col-xs-12 emobox' style='min-width:500px;' id='" + det_name + "_parent'>";
		    html_str += "<div style='display:inline;' id='" + det_name + "_header'><h2>"+display_name
			+ " DAQ is <a id='" + det_name + "_status'>" + 
			GetStateHtml(detector_data, status_id) + "</a><strong id='" + det_name + "_timestring_div' style='font-size:10pt;color:black;'>&nbsp;" 
			+ timestring + "</strong>&nbsp;&nbsp;&nbsp;<span id='" + det_name + "_rate_div'></span>" + "<div class='pull-right'><button class='btn btn-default' style='background-color:white' type='button' data-toggle='collapse' data-target='#"+det_name+"_collapse' aria-expanded='false' aria-controls='"+det_name+"_collapse' onClick='ExpanderClick(this)'>Expand</button></div></h2></div><hr style='margin-top:2px;margin-bottom:2px;'>";
		    //add a second line for the run information
		    html_str += ( "<div class='row col-xs-12'>" +
				  "<div class='col-xs-6' style='font-size:10pt;text-overflow:ellipsis;padding:0;'><em><strong>Run name:&nbsp;</strong><span id='" + 
				  det_name + "_runname'></span></div>" + 
				  "<div class='col-xs-6' style='word-wrap:break-word;font-size:10pt;text-overflow:ellipsis;'><em><strong>Started by:&nbsp;</strong><span id='" + 
				  det_name + "_startedby'></span></div></div><div class='row col-xs-12'>" +  
				  "<div class='col-xs-6' style='font-size:10pt;text-overflow:ellipsis;padding:0;'><em><strong>Mode:&nbsp;</strong><span id='" + 
				  det_name + "_runmode'></span></div>" +  
				  "<div class='col-xs-6' style='font-size:10pt;text-overflow:ellipsis;overflow:hidden;'><em><strong>Start Date:&nbsp;</strong><span id='" + 
				  det_name + "_startdate'></span></div>" +  
				  "</div>");
		    html_str += "</div>";
		    $('#'+div_id).append(html_str);
		    if( detector_data['status'][status_id]['state'] == "Running")
                        FillOutRunInfo(det_name, detector_data, status_id);
		    var appstring = "<div class='row col-xs-12 collapse' id='"+det_name+"_collapse' style='padding:0'><table class='table table-condensed'><thead class='emo-node-header'><tr><th>Slave node</th><th>Run mode</th><th>Digitizers</th><th>BLTs (Hz)</th><th>Raw Data (MB/s)</th><th>RAM (MB)</th><th>CPU frac</th><th>Updates(s)</th></tr></thead>";
/*		    var header_html = "<strong><div class='row emo-node-header' style='border-width:1px;border-style:solid;'>" +
                        "<div class='col-xs-2'>Slave node</div>"+
                        "<div class='col-xs-2'>Run mode</div>"+
                        "<div class='col-xs-2'>Digitizers</div>"+
                        "<div class='col-xs-2'>BLT Rate (Hz)</div>"+
                        "<div class='col-xs-2'>Data Rate (MB/s)</div>"+
                        "<div class='col-xs-2'>Updated (s)</div>" +
                        "</div></strong>";
			*/
		    //$('#'+det_name + "_parent").append(header_html);
		    //var appstring = "<div id='"+det_name+"_node_div'>";
		    appstring += "<tbody id='"+det_name+"_node_div'>";
		    for(var index=0;index<nodeInfo[det_name].length; index+=1)
			appstring+= nodeInfo[det_name][index];
		    //appstring+= "</div></div>";
		    appstring += "</tbody></table></div>"
		    $('#'+det_name + "_parent").append(appstring);
		   // UpdateDetectorTextNew(dataUrl, nodesUrl, div_id);

	    }

	}
	    callback();
	//$.getJSON( nodesUrl, function(nodes_data){
    //});
	});
    });
}


function UpdateDetectorText(dataUrl, divname){
    $.getJSON( dataUrl, function(data){

        var html_string = "<div class='row emo-det-header' style='border-width:1px;border-style:solid;'>"+
            "<strong><div class='col-xs-2'>Detector</div><div class='col-xs-2'>Status</div><div class='col-xs-2'>Mode</div>" +
            "<div class='col-xs-2'>Started by</div><div class='col-xs-2'>Start time</div><div class='col-xs-2'>Current/last run</div></strong></div>";
        var currentTime = new Date();
	
        for ( var x=0; x<data['status'].length; x+=1 ){
	    
            if( data['status'][x]['detector'] == 'tpc')
                html_string += "<div class='row emo-det-row' style='border-width:1px;border-style:solid;'>" +
                "<div class='col-xs-2'><h4>TPC</h4></div>";
            else if( data['status'][x]['detector'] == 'muon_veto')
                html_string += "<div class='row emo-det-row' style='border-width:1px;border-style:solid;'>" +
                "<div class='col-xs-2'><h4>Muon Veto</h4></div>";
            else
                html_string += "<div class='row emo-det-row' style='border-width:1px;border-style:solid;'>" +
                "<div class='col-xs-2'><h4>"+data['status'][x]['detector']+"</h4></div>";
	    
            // Reformat date for display in JS
            var docdate = new Date(data['status'][x]['createdAt']['$date']);
            var update_seconds = Math.round( (currentTime - docdate)/1000 );
	    
            // Put state with coloring to make it pop a little
	    var timestring = "";
            if( data['status'][x]['state'] == "Running" && update_seconds < 30 ){
                html_string += "<div class='col-xs-2' style='color:green;height:100%;'><h5>Running</h5></div>";
		startdate = new Date( thedatestring );
                timestring = GetTimeString( startdate );                
	    }
            else if( data['status'][x]['state'] == "Idle" && update_seconds < 30 )
                html_string += "<div class='col-xs-2' style='color:red;height:100%;'><h5>Idle</h5></div>";
            else if( data['status'][x]['state'] == "Error" && update_seconds < 30 )
                html_string += "<div class='col-xs-2' style='color:red;height:100%'><h5>Error</h5></div>";
            else
                html_string += "<div class='col-xs-2' style='color:#AAAAAA;height:100%;'><h5>Unknown</h5></div>";
	    
	    document.getElementById("timestring_div").innerHTML=timestring;
            // If running we can provide a bunch more information
            if( data['status'][x]['state'] == "Running" ) {
                //var startdate = new Date(data['status'][x]['startTime']);
		var startdate = data['status'][x]['startTime'];
		
                html_string += "<div class='col-xs-2'><h6>" + data['status'][x]['mode'] + "</h6></div>";
                html_string += "<div class='col-xs-2'><h6>" + data['status'][x]['startedBy'] + "</h6></div>";
                html_string += "<div class='col-xs-2'><h6>" + startdate + "</h6></div>";
                html_string += "<div class='col-xs-2'><h6>" + data['status'][x]['currentRun'] + "</h6></div>";
            }
            else
                html_string += "<div class='col-xs-2 col-xs-offset-6'><h6>" + data['status'][x]['currentRun'] + "</h6></div>";
	    
	    
            // close row
            html_string += "</div>";
	    
        }
        document.getElementById(divname).innerHTML = html_string;
    });
}

function UpdateNodes( nodes_div, nodesUrl ){

        $.getJSON( nodesUrl, function(data) {
	    
	    //var html_string = "<table class='table'><thead class='emo-node-header'><tr><th>Slave node</th><th>Run mode</th><th>Digitizers</th><th>BLT rate (Hz)</th><th>Data rate (MB/s)</th><th>Updates(s)</th></thead>";
	    var html_string ="";
/*            var html_string = "<strong><div class='row emo-node-header' style='border-width:1px;border-style:solid;'>" +
                        "<div class='col-xs-2'>Slave node</div>"+
                        "<div class='col-xs-2'>Run mode</div>"+
                        "<div class='col-xs-2'>Num. digitizers</div>"+
                        "<div class='col-xs-2'>BLT Rate</div>"+
                        "<div class='col-xs-2'>Data Rate</div>"+
                        "<div class='col-xs-2'>Seconds since update</div>" +
                        "</div></strong>";
*/
            var currentTime = new Date();

            for ( var x=0; x<data.length; x++ ){

                var docdate = new Date(data[x]['createdAt']['$date']);
				var update_seconds = Math.round( (currentTime - docdate)/1000 );
                var color = "black";
                if (update_seconds > 30 )
                    color = "#AAAAAA";

		html_string += "<tr style='color:" + color + "'>" +
		    "<td>" + data[x]['node'] + "</td>" +
		    "<td>" + data[x]['runmode'] + "</td>" +
		    "<td>" + data[x]['nboards']+ "</td>" +
		    "<td>" + data[x]['bltrate']+ "</td>" +
		    "<td>" + data[x]['datarate']+ "</td>" +
		    "<td>" + data[x]['ram']+"</td>"+
		    "<td>" + data[x]['cpu'] + "</td>"+
		    "<td>" + update_seconds.toString()+ "</td></tr>";

/*                html_string += "<div class='row emo-node-line' style='color:" + color + "'>" +
                        "<div class='col-xs-2'>" + data[x]['node'] + "</div>"+
                        "<div class='col-xs-2'>" + data[x]['runmode'] + "</div>"+
                        "<div class='col-xs-2'>" + data[x]['nboards'] + "</div>"+
                        "<div class='col-xs-2'>" + data[x]['bltrate'] + "</div>"+
                        "<div class='col-xs-2'>" + data[x]['datarate'] + "</div>"+
                        "<div class='col-xs-2'>" + update_seconds.toString() + "</div>" +
                        "</div>";
*/
            }

            document.getElementById( nodes_div).innerHTML = html_string;
        });

}

function GetMongoDBProgress(percent, name, warnpct, errpct, rawval, rawunit){

    warnpct = 128/(128+880);
    rethtml = "";
    var first_width = percent;
    var second_width = first_width-warnpct;
    
    if(first_width>warnpct)
	first_width=warnpct;
    if(first_width-warnpct>0)
	second_width=first_width-warnpct;
    
    rethtml += '<div class="progress-bar progress-bar-info" role="progressbar" style="border-top-right-radius:0;border-bottom-right-radius:0;width:'+(Math.floor(100*first_width)).toString()+'%">';
    rethtml +='RAM';//+rawval.toFixed(2)+' '+rawunit+' '+name;
    rethtml += '</div>';
    if(second_width > 0.){	
        rethtml += '<div class="progress-bar progress-bar-warning" role="progressbar" style="border-radius:0;width:'+(Math.floor(100*second_width)).toString()+'%">';
	if(second_width>.5)
	    rethtml+="SSD Buffer</div>";
	else
	    rethtml+="</div><span style='color:#dcd373'>SSD Buffer</span>";	
      }
    rethtml+="<span style='float:right;text-align:right'>"+rawval.toFixed(2)+" "+rawunit+"</span>";
    return rethtml;
}
function GetGradProgress(percent, name, warnpct, errpct, rawval, rawunit){

    rethtml = "";

    var first_width = percent;
    var second_width = 0;
    var third_width =0;
    if(first_width > warnpct)
        first_width = warnpct;
    var leftpct = percent - warnpct;
    if(leftpct > 0){
        second_width = leftpct;
        if(second_width > (errpct-warnpct))
            second_width = (errpct-warnpct);
        leftpct -= (errpct-warnpct);
        if(leftpct > 0){
            third_width = leftpct;
	    if(third_width > 1.-errpct)
		third_width = 1.-errpct;
        }
    }

    rethtml += '<div class="progress-bar progress-bar-success" role="progressbar" style="border-top-right-radius:0;border-bottom-right-radius:0;width:'+(Math.floor(100*first_width)).toString()+'%">';
      if(percent > .3) rethtml +=' '+rawval.toFixed(2)+' '+rawunit+' '+name;
      rethtml += '</div>';
      if(second_width != 0){
          rethtml += '<div class="progress-bar progress-bar-warning" role="progressbar" style="border-radius:0;width:'+(Math.floor(100*second_width)).toString()+'%"></div>';
      }
    if(third_width !=0 ){
	rethtml += '<div class="progress-bar progress-bar-danger" role="progressbar" style="border-top-left-radius:0;border-bottom-left-radius:0;width:'+(Math.floor(100*third_width)).toString()+'%"></div>';
      }
    if(percent <=.3){
       rethtml += ' '+rawval.toFixed(2)+' '+rawunit+' '+name;
    }
    return rethtml;

}

function GetHealth(pctarray, static_dir, update_time, deleter_time){
    health="Good";
    largest = 0.;
    for(i=0; i<pctarray.length;i+=1){
	if(pctarray[i]>largest)
	    largest = pctarray[i];
    }
    image = "";

    if (largest >= .9)
	image="<img src='"+static_dir+"/doom_faces/dead.png'";
    else if (largest > .8)
	image= "<img src='"+static_dir+"/doom_faces/bloody_pissed.png'";
    else if (largest > .5)
	image="<img src='"+static_dir+"/doom_faces/bloody_smile.png'";
    else if (largest > .3)
	image="<img src='"+static_dir+"/doom_faces/bruised_pissed.png'";
    else if (largest > .2)
	image="<img src='"+static_dir+"/doom_faces/clean_pissed.png'";
    else
	image="<img src='"+static_dir+"/doom_faces/clean_smile.png'";
    image += " style='width:50px' class='center-block'>";

    if(largest>.9)
	health="<strong style='color:red'>Dead</strong>";
    else if(largest > .7)
	health="<strong style='color:orange'>Nearly dead</strong>";
    else if(largest > .5)
	health="<strong style='color:yellow;background-color:black;'>Warning</strong>";
    else if(largest > .35)
	health="<strong style='color:blue'>Borderline</strong>";
    else
	health="<strong style='color:green'>Healthy</strong>";

    var now = new Date();
    var timeDiff=0;
    if (! isNaN( update_time.getTime() ) )
	timeDiff = Math.abs(now.getTime() - update_time.getTime())/1000.;
    if(isNaN( update_time.getTime() ) || timeDiff > 300){
	health = health="<strong style='color:red'>Trigger maybe not responding</strong>";
	image="<img src='"+static_dir+"/doom_faces/dead.png' style='width:50px' class='center-block'>";
    }
    if(timeDiff >= 30){
	document.getElementById("stale_header").innerHTML = 
	    "<span class='bg-danger' style='width:100%;'>Warning, values more than 1 minute old. This may or may not be an issue.</span>";
    }
    if(timeDiff < 60)
	document.getElementById("stale_header").innerHTML = "";

    var dtimediff = 0;
    if(! isNaN( deleter_time.getTime()) )
	dtimediff = Math.abs(now.getTime() - deleter_time.getTime())/1000.;
    if(isNaN( deleter_time.getTime() ) || dtimediff > 300){
        health = "<strong style='color:red'>Data deleter inactive</strong>";
        image="<img src='"+static_dir+"/doom_faces/clean_pissed.png' style='width:50px' class='center-block'>";
    }

    return {"text": health, "image": image};
}

