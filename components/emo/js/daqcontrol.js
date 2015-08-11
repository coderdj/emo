
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
                pointPadding: 0,
                borderWidth: 0,
                stacking : false,
                stack : 0,
                marker: {enabled:false},		
            },
        },
	series: [],

    }; //end waveform options    
    
    chart = new Highcharts.Chart(waveformOptions);
    callback(chart);

}

function updateData( chart, updateUrl )
// Once the chart is loaded you can call this to update the data
{
    $.getJSON(updateUrl,function(data){
	var detlist = ['xedaq01', 'xedaq02', 'xedaq03', 'xedaq04', 'muon_veto'];
        var idlist = ['tpc_0','tpc_1','tpc_2','tpc_3','muon_veto_0'];        
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


function loadData( chart, dataURL, callback )
// Loads data from the URL into the chart. 
// Used the first time only
{
    var fillColors = ["rgba(92,184,92,0.2)", "rgba(217,83,79,0.2)",
    "rgba(91,192,222,0.2)", "rgba(240,173,78,0.2)", "rgba(220,133,21,0.2)"];
    var colors = ["#5cb85c","#d9534f", "#5bc0de", "#f0ad4e", "#785223" ];

    $.getJSON( dataURL, function(data) {

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
    });
    callback(chart);
}


function GetTimeString(startdate){
    // Return the time string based on the run's start time
    // also computes how long run has been running in a nice way

    var nowdate = new Date();
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
                if( data['status'][x]['state'] == "Running" && update_seconds < 30 )
                    html_string += "<div class='col-xs-2' style='color:green;height:100%;'><h5>Running</h5></div>";
                else if( data['status'][x]['state'] == "Idle" && update_seconds < 30 )
                    html_string += "<div class='col-xs-2' style='color:red;height:100%;'><h5>Idle</h5></div>";
                else if( data['status'][x]['state'] == "Error" && update_seconds < 30 )
                    html_string += "<div class='col-xs-2' style='color:red;height:100%'><h5>Error</h5></div>";
                else
                    html_string += "<div class='col-xs-2' style='color:#AAAAAA;height:100%;'><h5>Unknown</h5></div>";

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

            var html_string = "<strong><div class='row emo-node-header' style='border-width:1px;border-style:solid;'>" +
                        "<div class='col-xs-2'>Slave node</div>"+
                        "<div class='col-xs-2'>Run mode</div>"+
                        "<div class='col-xs-2'>Num. digitizers</div>"+
                        "<div class='col-xs-2'>BLT Rate</div>"+
                        "<div class='col-xs-2'>Data Rate</div>"+
                        "<div class='col-xs-2'>Seconds since update</div>" +
                        "</div></strong>";

            var currentTime = new Date();

            for ( var x=0; x<data.length; x++ ){

                var docdate = new Date(data[x]['createdAt']['$date']);
				var update_seconds = Math.round( (currentTime - docdate)/1000 );
                var color = "black";
                if (update_seconds > 30 )
                    color = "#AAAAAA";

                html_string += "<div class='row emo-node-line' style='color:" + color + "'>" +
                        "<div class='col-xs-2'>" + data[x]['node'] + "</div>"+
                        "<div class='col-xs-2'>" + data[x]['runmode'] + "</div>"+
                        "<div class='col-xs-2'>" + data[x]['nboards'] + "</div>"+
                        "<div class='col-xs-2'>" + data[x]['bltrate'] + "</div>"+
                        "<div class='col-xs-2'>" + data[x]['datarate'] + "</div>"+
                        "<div class='col-xs-2'>" + update_seconds.toString() + "</div>" +
                        "</div>";

            }

            document.getElementById( nodes_div).innerHTML = html_string;
        });

}

