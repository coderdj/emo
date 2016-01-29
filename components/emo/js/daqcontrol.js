function ExpanderClick(button) {
    if(button.innerHTML=="Expand")
	button.innerHTML="Hide detail";
    else
	button.innerHTML="Expand";
};

function drawChart( chart, chartdiv, callback )
// Draws a chart at the chart div
// Only have to call once
{
    // Make dictionary of options
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
        borderWidth:1,
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
            area: {
		fillColor: {
                    linearGradient: {
                        x1: 0,
			y1: 0,
                        x2: 0,
                        y2: 1
                    },
                },          
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
	var detlist = ['reader00', 'reader01', 'reader02', 'reader03', 'reader04', 'muon_veto'];
        var idlist = ['reader00','reader01','reader02','reader03', 'reader04', 'reader05'];        
	console.log(data);
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
	if( x< 5 )
            dict = {
		color: colors[x],
		fillColor: fillColors[x],
		data: data[x]['data'],
		name: data[x]['node'],
            };
	else
            dict = { data: data[x]['data'], name: data[x]['node']};
	chart.addSeries(dict, false);
    }
    
    chart.redraw();
    callback(chart);
}


function GetTimeString(startdate){
    // Return the time string based on the run's start time
    // also computes how long run has been running in a nice way
    var nowdate = new Date();
    var diff = nowdate-startdate;
    console.log(nowdate);
    console.log(startdate);
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

function GetRateString(rate){
    if(rate < 1.){
	rate = rate/1000.;
	return (rate.toFixed(2) + " kB/s");
    }
    return (rate.toFixed(2) + " MB/s");
}
function UpdateDetectorTextNew(dataUrl, nodesUrl, div_id){
  
    var aliases = {"tpc": "TPC", "muon_veto": "Muon Veto"};

    $.getJSON( dataUrl, function(detector_data){
console.log(detector_data);
console.log("flipflop");
	$.getJSON( nodesUrl, function(node_data) {

	    
	    var currentTime = new Date()
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
                    "<td>" + update_seconds.toString()+ "</td></tr>";

		if(node_data[node_id]['node']!='reader5'){ // as in 'reader0x'
		    nodeInfo['tpc'].push(html_string);
		    tpc_rate+=node_data[node_id]['datarate']
		}
		else{
		    nodeInfo['muon_veto'].push(html_string);
		    muon_veto_rate+=node_data[node_id]['datarate'];
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
		    console.log("Found header");
		    var startdate = detector_data['status'][status_id]['startTime'];
		    console.log(detector_data['status'][status_id]);
		    document.getElementById(det_name+"_status").innerHTML = GetStateHtml(detector_data,status_id);
		    document.getElementById(det_name+"_runname").innerHTML = detector_data['status'][status_id]['currentRun'];
		    document.getElementById(det_name+"_startedby").innerHTML = detector_data['status'][status_id]['startedBy'];
		    document.getElementById(det_name+"_runmode").innerHTML = detector_data['status'][status_id]['mode'];
                    document.getElementById(det_name+"_startdate").innerHTML = startdate;
		    
		    var timestring = "";
		    thedatestring = detector_data['status'][status_id].startTime;
                    console.log(thedatestring);
                    thedatestring = thedatestring.substr(0, thedatestring.length - 8);
		    thedatestring += "+01:00";

		    startdate = new Date( thedatestring  );
                    if(detector_data['status'][status_id]['state'] == "Running"){
			timestring = GetTimeString( startdate );
			if(det_name == 'tpc')
			    document.getElementById(det_name+"_rate_div").innerHTML = GetRateString(tpc_rate);
			else
			    document.getElementById(det_name+"_rate_div").innerHTML = GetRateString(muon_veto_rate);
		    }
		    else 
			document.getElementById(det_name+"_rate_div").innerHTML="";
		    document.getElementById(det_name+"_timestring_div").innerHTML = timestring;			
		    
		    

		    var appstring = "";
		    for(var index=0;index<nodeInfo[det_name].length;index+=1){
			appstring+=nodeInfo[det_name][index];
			
		    }
		    console.log(appstring);
		    document.getElementById(det_name+"_node_div").innerHTML = appstring;
		}
		else{ // append a new header
		    console.log(detector_data);
		    var timestring="";
		    if(detector_data['status'][status_id].startTime!=""){
			thedatestring = detector_data['status'][status_id].startTime;
			console.log(thedatestring);
			thedatestring = thedatestring.substr(0, 
							     thedatestring.length - 
							     8);
			thedatestring += "+01:00";
			console.log(thedatestring);
			
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
		    var appstring = "<div class='row col-xs-12 collapse' id='"+det_name+"_collapse' style='padding:0'><table class='table table-condensed'><thead class='emo-node-header'><tr><th>Slave node</th><th>Run mode</th><th>Digitizers</th><th>BLT rate (Hz)</th><th>Data rate (MB/s)</th><th>Updates(s)</th></tr></thead>";
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
		    console.log(appstring);
		    $('#'+det_name + "_parent").append(appstring);
		    UpdateDetectorTextNew(dataUrl, nodesUrl, div_id);
	    }

	}

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

