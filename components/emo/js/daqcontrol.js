
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
	    backgroundColor:'rgba(255, 255, 255, 0.1)',
            type: 'area',
            zoomType: 'xy',
            animation: {
                easing: 'linear',
              },
	    spacingTop: 2,
            spacingLeft: 1,
            spacingRight: 1,
            spacingBottom: 2,
        },
	legend: {align: 'left', verticalAlign: 'middle',layout: 'vertical',enabled: true, itemMarginBottom: 5},
        credits: {enabled: false},
        title: {text: ''},
        xAxis: {
            maxPadding:0,
            minPadding:0,
            title : { text: 'time (your time zone)' },
            labels: { enabled: true},
            tickInterval: 5000000,
            type: 'datetime',
            labels: {
                formatter: function() {
                    var d = new Date();
                    return Highcharts.dateFormat('%H:%M', this.value - d.getTimezoneOffset()*60000);
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
	series: [{
            name: 'xedaq01',
            color: '#5cb85c',
            fillColor: 'rgba(92,184,92,0.2)',
            data: [],
        },{
            name: 'xedaq02',
              color: '#d9534f',
            fillColor: 'rgba(217,83,79,0.2)',
            data: [],
        },{
            name: 'xedaq03',
              color: '#5bc0de',
            fillColor: 'rgba(91,192,222,0.2)',
            data: [],
        },{
	    name: 'xedaq04',
            color: '#f0ad4e',
            fillColor: 'rgba(240,173,78,0.2)',
            data: [],
        },{
            name: 'muon_veto',
            color: '#785223',
            fillColor: 'rgba(220,133,21,0.2)',
            data: [],
        },
                ],
    }; //end waveform options    
    
    chart = new Highcharts.Chart(waveformOptions, callback(chart));

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
    $.getJSON( dataURL, function(data) {
	chart.series[0].setData(data['xedaq01_rates'],false);
        chart.series[1].setData(data['xedaq02_rates'],false);
        chart.series[2].setData(data['xedaq03_rates'],false);
        chart.series[3].setData(data['xedaq04_rates'],false);
        chart.series[4].setData(data['muon_veto_rates'],false);
        chart.redraw();
    });
    callback(chart);
};

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
};

function UpdateText( currentStatus, detString, detStringLong, document, numSlaves, canStartRuns, latestRates ){
    
    // We have a text display showing rates and connectivity status of readers
    // This function updates it. CurrentStatus is status.det. detString is the
    // suffix identifying DOM elements for each detector. document is the doc.


    if( currentStatus == null )
	return;
    // need STATUS_HTML, RUN_NAME, STARTED_BY, MODE, NUMSLAVES
    var MODE = currentStatus.mode;
    var STARTED_BY = currentStatus.startedBy;
    var RUN_NAME = currentStatus.currentRun;
    var NUMSLAVES = currentStatus.NUMSLAVES;

    var STATUS_HTML = "<h3 style='color:red'>Idle</h3>";
    if (currentStatus.state == "Armed" )
	STATUS_HTML = "<h3 style='color:#c6961d'>Armed</h3>";
    else if( currentStatus.state == "Running" ){
	var startdate = new Date( currentStatus.startTime );
        timestring = GetTimeString( startdate );
        STATUS_HTML = "<h3 style='margin-bottom:0'><a style='font-size:18pt;color:green'>Running</a> <a style='font-size:10pt;color:black;'>&nbsp;" + timestring + "</a></h3>";
    }

    


    var HTMLSTRING = "<div class='dcpanel-header'><div class='col-xs-4 col-sm-4 col-md-4'><h3>" + detStringLong + "</h3></div><div class='col-xs-8 col-sm-8 col-md-8'><div class='pull-right'><span id='stateindicator_" + detString + "'>" + STATUS_HTML + "</span></div></div></div><hr style='margin:0;'><!-- END HEADER --><!-- INFO TEXT --><div style='margin-bottom:1%;'>   <div class='col-md-6 col-xs-12 dcsmalltext' style='margin:0px;padding:0px;'>      <div class='list-group' style='margin:0;'>         <li class='list-group-item nopad' style='border:0'>            <b>Run Name: </b>             <span id='run_" + detString + "'>" + RUN_NAME +"</span></li>         <li class='list-group-item nopad' style='border:0'>             <b>Started by: </b>              <span id='startedby_" + detString + "'>" + STARTED_BY + "</span></li>      </div>   </div>   <div class='col-md-6 col-xs-12 dcsmalltext' style='margin:0px;padding:0px;'>      <div class='list-group' style='margin:0px;'>         <li class='list-group-item nopad' style='border:0'>            <b>Mode: </b><span id='mode_" + detString + "'>" + MODE + "</span></li>         <li class='list-group-item nopad' style='border:0'>            <b> Connected clients: </b>             <span id='numslaves_" + detString + "'>" + NUMSLAVES + "</span> </li>      </div>  <br>";

    for( x=0; x<numSlaves; x++) {
	var IDSTR = detString + "_" + x.toString;
	if( latestRates[IDSTR] == null )
	    continue;
	var ABSRATE = ((latestRates[IDSTR]*1000).toFixed(2)).toString();
	var PCTRATE = (math.Round( (latestRates[IDSTR]*1000 / 80.) )).toString();
	HTMLSTRING += "<div class='container col-xs-12'>   <h5 id='" + IDSTR + "_name' style='color:#AAAAAA;font-size:10pt;float:left;margin-right:1em;margin-top:0px;margin-bottom:3px;'>" + IDSTR + "</h5>   <div class='progress' id='" + IDSTR + "_progress' style='margin-bottom:3px;background-color:#EEEEEE;'>   <div class='progress-bar progress-bar-info progress-bar-striped active' id='" + IDSTR + "_bar' role='progressbar' aria-valuenow='" + PCTRATE + "' aria-valuemin='0' aria-valuemax='100' style='width:" + PCTRATE + "%;'>" + ABSRATE + "MB/s</div></div></div>";
    }
    if( canStartRuns ){
	
	//update buttons
	HTMLSTRING += "<div class='pull-right'>   <button class='btn btn-success' id='" + detString + "start' onclick='NewCommand(\"sd\")'>Start " + detStringLong + " Calibration</button>   <button class='btn btn-danger' id='" + detString + "stop' onclick='NewCommand(\"pd\")'>Stop " + detStringLong + " Only</button></div>";
    }

    document.getElementById( "info_" + detString ).innerHTML = HTMLSTRING;
};
	

