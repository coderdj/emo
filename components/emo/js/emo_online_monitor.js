/* This variable defined reasonable starting points for ranges for 2d hists */
var hist_bounds = {
    "x": { "min": -50, "max": 50, "bins": 100 },
    "y": { "min": -50, "max": 50, "bins": 100 },
    "s1": { "min": 0, "max": 5000, "bins": 100 },
    "s2": { "min": 0, "max": 200000, "bins": 100 },
    "cs1": { "min": 0, "max": 5000, "bins": 100},
    "cs2": { "min": 0, "max": 200000, "bins": 100 },
    "dt": { "min": 0, "max": 700000, "bins": 100 },
    "r": { "min": 0, "max": 50, "bins": 100 },
    "z": { "min": -100, "max": 0, "bins": 150 },
    "s2_range_50p_area": {"min": 0, "max": 5000, "bins": 500 },
}


// REQUIRES Mustache.js
function MakeHistXY(drawdiv, templatediv, pars, xvar, yvar, xmod, ymod, 
		    xunit, yunit, xmin, xmax, ymin, ymax, logz)
{
    pars['x'] = xvar;
    pars['y'] = yvar;
    $.post("/online_monitor/get_plot_xy", pars, function(record){ 

	// The view describes how to make each row
	var template = $.trim($("#"+templatediv).html());
	Mustache.parse(template);
	
	//console.log(record);
	// placeholder
	//record = {
	//vars: ['s1', 's2', 'x', 'y', 'r', 'dt'],	
    //};
	/*
	  Render the xvar dropdown. Contains entry for each available variable
	  with the chosen one selected
	*/
	var xvarhtml = "";
	for(i=0; i<record['vars'].length; i+=1){
	    xvarhtml += "<option value='"+record['vars'][i]+"'"
	    if(record['vars'][i]==xvar)
		xvarhtml += " selected";
	    xvarhtml += ">"+record['vars'][i]+"</option>";
	}
	var yvarhtml = "";
	for(i=0; i<record['vars'].length; i+=1){
        yvarhtml +="<option value='"+record['vars'][i]+"'"
            if(record['vars'][i]==yvar)
		yvarhtml += " selected";
            yvarhtml += ">"+record['vars'][i]+"</option>";
	}
	
	/* 
	   Render the title with a bit larger view of the x,y
	*/
	var title = xvar + " vs " + yvar;
	
	/*
	  Render the xmin, xmax ymin, ymax, binsx, binsy 
	*/
	//later
	
	var plotid = drawdiv;
	
	// souce events status tags top_comment
	document.getElementById(drawdiv).innerHTML = 
	    Mustache.render(template, {xvar: xvarhtml, yvar: yvarhtml, 
				       title: title, plotid: plotid});
	//console.log(title);
	//console.log(record['x']);
	//console.log(record['y']);
	console.log(record);
	var series = [
            {
		x: record['x'],
		y: record['y'],
		
                histnorm: 'log',
		autobinx: false,          
		autobiny: false,        

		xbins:{
		    start: hist_bounds[xvar]['min'],
		    end: hist_bounds[xvar]['max'],
		    size: (hist_bounds[xvar]['max']-hist_bounds[xvar]['min'])/
			hist_bounds[xvar]['bins'],
		},
		ybins:{
                    start: hist_bounds[yvar]['min'],
                    end: hist_bounds[yvar]['max'],
                    size: (hist_bounds[yvar]['max']-hist_bounds[yvar]['min'])/
			hist_bounds[yvar]['bins'],
                },

		
		colorscale: [['0', 'rgb(12,51,131)'], ['0.25', 'rgb(10,136,186)'], 
			     ['0.5', 'rgb(242,211,56)'], ['0.75', 'rgb(242,143,56)'], 
			     ['1', 'rgb(217,30,30)']],
		
		type: 'histogram2d'
	    }
	];
	if(logz){
	    console.log("LOGZ" + title);
	    series[0]['colorscale'] =  [[0, 'rgb(12,51,131)'],
				     [1./1000, 'rgb(10,136,186)'],
				     [1./100, 'rgb(242,211,56)'],
				     [1./10, 'rgb(242,143,56)'],
				     [1./1, 'rgb(217,30,30)']];
	    series[0]['colorbar'] = {
		'type': 'log',
		'tick0': 0,
		'tickmode': 'array',
		'tickvals': [100000, 10000, 1000, 10]
	    };

	}

	var layout = {
	    margin: {t: 10, b:50, l:45, r:25},
	    title: '',
	    zaxis: {"type": "log"},
	    xaxis: {"title": xvar},
	    yaxis: {"title": yvar},
	};
	//var height = $("#plotdiv_"+plotid).width();
	//$("#plotdiv_"+plotid).height(height);
	Plotly.newPlot("plotdiv_"+plotid, series, layout);
	$("#"+drawdiv).show(200);
    });    
};


