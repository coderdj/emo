// REQUIRES SteamTable.js Mustache.js
function MakeRunsTable(div, url, templatediv, counterdiv){

    // The view describes how to make each row
    //var template = $.trim($("#"+templatediv).html());
    var template = "<tr><td style='width:10px'>{{{ link }}}</td><td>{{ number }}</td><td style='width:30px'>{{ date }}</td><td>{{ source }}</td><td>{{ events }}</td><td>{{{ status }}}</td><td style='width:30px'>{{{ tags }}}</td><td style='width:100px'>{{{ top_comment }}}</td></tr>";
    Mustache.parse(template);
    var view = function(record, index){
	/*
	  Render the link. This is a link to a detail request	  
	 */
	color="#5992c2";
	var link = "<button class='btn' onclick='ShowDetail("+
	    '"' + record.name + '", "' + record.detector + '")' + "'" + 
	    " style='background_color:"+color+";'>+</button>";
	
	/*
	  The number is either the number or the name depending on detector
	*/
	var number = record.name;
	if(record.detector=="tpc")
	    number = record.number;

	/* 
	   The date should get properly formatted
	*/
	var date = new Date(record["start"]['$date']);
        var datestring = date.getUTCDate() + "." +
            ("0"+(date.getUTCMonth()+1)).slice(-2) +
            "." + ("0"+date.getUTCFullYear()).slice(-2) + " at " +
            ("0"+date.getUTCHours()).slice(-2) + ":" +
            ("0"+date.getUTCMinutes()).slice(-2) + ":" +
            ("0"+date.getUTCSeconds()).slice(-2);

	/* 
	   The souce should be easy.
	*/
	var source  = record.source.type;

	/* 
	   Number of events from trigger
	*/	
	var events = 0;
	if("trigger" in record && "events_built" in record.trigger)
	    events = record.trigger.events_built;

	/* 
	   Status is harder. Offload to another function.
	*/
	var status = GetDataState(record.data);

	/*
	  Tags is a list of tags. Click one to see all runs with that tag
	*/
	var tags = "";
	if("tags" in record){
	    for(x=0;x<record.tags.length;x+=1){
		tags+='<a style="cursor:pointer;" onclick="ShowTag('+"'"+
		    record['tags'][x]['name']+"')" + '">'+
		    record['tags'][x]['name']+' </a>';
	    }
	}

	var top_comment = "";
	if("comments" in record && record.comments.length != 0){
	    top_comment = record.comments[0]['text'];
	}
	
	//console.log(template);
	// souce events status tags top_comment
	return Mustache.render(template, {link: link, number: number, 
					 date: datestring, source: source,
					 events: events, status: status, 
					 tags: tags, top_comment: top_comment});
    };

    var callbacks = {
	"after_add": function(){
            //console.log(counterdiv);
            document.getElementById(counterdiv).innerHTML=this.data.length;
	}
    };
    var options = {
	view: view,                  //View function to render table rows.
	data_url: url,               //Data fetching url
	stream_after: 0.1,           //Start streaming after 2 secs
	fetch_data_limit: 500,       //Streaming data in batch of 500 

	// Undocumented option baby
	params: {
	    //"mongo_query": JSON.stringify({ "detector": "muon_veto"}),
	    //"detector": "muon_veto",
	},

	pagination:{
	    container: ".paginat",
            span: 5,                              
            next_text: 'Next &rarr;',              
            prev_text: '&larr; Previous',
            //container_class: '.users-pagination', 
            //ul_class: '.larger-pagination',       
            per_page_select: false,                 
            per_page_opts: [50, 100, 500],            
            //per_page_class: '.select-box',       
            per_page: 100,
	},
	search_box: "#tablesearch",
	fields: function(record) { 
	    ret= [ 
		record.name,
		record.number,
		record.source.type,
	    ];
	    if('tags' in record && record.tags.length>0)
		ret.push(
		    $.map(record.tags, function(tag) { return tag.name } )
		);
	    return ret.join(' ');
	},
	callbacks: callbacks,
    };
    if(document.streamTable != null) {
	console.log("Applying clear");
	var st = $(document.streamTable).data('st');
	$(document.streamTable + " > tbody").html("");
	$(document.streamTable).data('st', null);
	document.getElementById(counterdiv).innerHTML="0";
    }

    $("#"+div).stream_table(options, []);
    document.streamTable="#"+div;
};

function ShowTag(tagname){

    $("#form_query").val('{"tags": {"$elemMatch": {"name": "'+tagname+
			 '"}}}');
    RefreshTable();
}

function SlideOutDetail(){
    $("#detail_window > div").height($(window).height()-50);
  //  $(".runsHider").show("fade", 50);
    $("#detail_window").show("slide", { direction: "right" }, 200);
}
function HideDetail(){
    $("#detail_window").hide("fade", 50);
//    $(".runsHider").hide("fade", 50);
}

function ShowDetail(name, detector){
    
    runs_url = "/runs/get_run";
    params = {
	"detector": detector,
	"name": name
    };
    DrawDetailWindow(runs_url, params, 
		     "template_run_header", "run_detail_top", 
		     "template_tags", "template_tagbutton", "run_detail_tags",
		     "template_storage", "template_site", "detail_locations", 
		     function(){SlideOutDetail()});
}

function DateToString(dateval){
    if(dateval == null || dateval == "")
	return "";
    var ret = "";
    var date = new Date(dateval['$date']);
    ret +=
    date.getUTCDate() + "." +
        ("0"+(date.getUTCMonth()+1)).slice(-2) +
        "." + ("0"+date.getUTCFullYear()).slice(-2) + " at " +
        ("0"+date.getUTCHours()).slice(-2) + ":" +
        ("0"+date.getUTCMinutes()).slice(-2) + ":" +
        ("0"+date.getUTCSeconds()).slice(-2);
    return ret;
}

function DrawDetailWindow(url, params, header_template, header_div, 
			  tag_template, tagbutton_template, tag_div, 
			  storage_template, storageloc_template, 
			  storage_div, callback)
//,
/*//add piece by piece			  comment_template, comment_div,
			  json_div, data_template, data_div, 
			  tags_template, tags_div)*/
{
    /*
      This is not so simple but OK, it does a lot. We want to fill a small 
      summary with literally everything you wanted to know about a run. 
      The templates have to have a specific format since we'll use 
      mustache to fill them. See runs.html for the format.
     */

    // First define all the Mustache templates
    var title_template = $.trim($("#"+header_template).html());     
    Mustache.parse(title_template);

    // Probably here you want to put a loading animation
    // over the parent div

    $.getJSON(url, params, function(data){

	run_number = data['name'];
	if('number' in data)
	    run_number = data['number'];
	source = "none";
	if('source' in data && 'type' in data['source'])
	    source = data['source']['type'];
	events = 0;
	if('trigger' in data && 'events_built' in data['trigger'])
	    events = data['trigger']['events_built'];
	title_args = {
	    "run_number": run_number,
	    "run_name": data['name'],
	    "detector": data['detector'],
	    "source_type": source,
	    "user": data['user'],
	    "start_date": DateToString(data['start']),
	    "end_date": DateToString(data['end']),
	    "events": events
	};
	$("#"+header_div).html(Mustache.render(title_template, 
					      title_args));
	$("#"+tag_div).html(DrawTagWindow(data, tag_template,
					  tagbutton_template));
	$("#"+storage_div).html(DrawStorageWindow(data, storage_template,
						  storageloc_template));
	callback();      
			      
    });
    
}
function GetColor(string){
    if (string=="transferred" || string=="processing")
	return "#36bc98";
    if(string=="transferring" || string=="checking" || string=="verifying")
	return "#f9a100";
    else
	return "#ec2c35";
}


function DrawStorageWindow(data, storage_template, storageloc_template){
    var storageloctemplate= $.trim($("#"+storageloc_template).html());
    Mustache.parse(storageloctemplate);

    rawhtml="";
    processedhtml="";
    otherhtml="";

    var untriggered = [];
    var raw = [];
    var processed = [];

    for(i=0; i< data['data'].length; i+=1){
	pars = {
	    "host": data['data'][i]['host'],
	    "status": data['data'][i]['status'],
	    "type": data['data'][i]['type'],
	    "location": data['data'][i]['location'],
	    "status_color": GetColor(data['data'][i]['status']),
	    "display_paxversion": "style='display:none'",
	    "pax_version": "trolololol"
	}
	console.log(pars);
	if(data['data'][i]['type'] == 'raw')
	    raw.push(Mustache.render(storageloctemplate, pars));
	else if(data['data'][i]['type'] == 'processed'){
	    pars['pax_version'] = data['data'][i]['pax_version'];
	    parx['display_paxcersion'] = "";
	    processed.push(Mustache.render(storageloctemplate, pars));
	}
	else
	    untriggered.push(Mustache.render(storageloctemplate, pars));
    }
    
    if(raw.length!=0){
	rawhtml += "<h4 style='margin-bottom:2px;'>Raw data</h4><hr style='margin-top:0px;margin-bottom:4px;'>";
	for(x=0;x<raw.length;x+=1){
	    rawhtml+=raw[x];
	}	
    }
    if(processed.length!=0){
	processedhtml+= "<h4 style='margin-bottom:2px;'>Processed data</h4><hr style='margin-top:0px;margin-bottom:4px;'>";
	for(x=0;x<processed.length;x+=1){
	    processedhtml+=processed[x];
	}
    }
    if(untriggered.length!=0){
	otherhtml += "<h4 style='margin-bottom:2px;'>Other</h4><hr style='margin-top:0px;margin-bottom:4px;'>";
	for(x=0;x<untriggered.length;x+=1){
            otherhtml+=untriggered[x];
        }
    }

    var storagetemplate = $.trim($("#"+storage_template).html());
    Mustache.parse(storagetemplate);
    pars = {
	"raw": rawhtml,
	"processed": processedhtml,
	"other": otherhtml
    };
    console.log(pars);
    console.log( Mustache.render(storagetemplate, pars));
    return Mustache.render(storagetemplate, pars);		    

}
function DrawTagWindow(data, tag_template, tagbutton_template){
    var tagtemplate = $.trim($("#"+tag_template).html());
    Mustache.parse(tagtemplate);
    var tagbuttontemplate= $.trim($("#"+tagbutton_template).html());
    Mustache.parse(tagbuttontemplate);

    buttonhtml = "";
    if("tags" in data){
	buttonhtml="<br style='margin:1px'><div style='width:100%'>";
	for(var i=0; i<data['tags'].length; i+=1){
	    bargs = {
		"name": data['tags'][i]['name'],
		'oid': data['_id']['$oid'],
		'hideifnotme': 'style="display:none"'
	    };
	    if(document.whoami == data['tags'][i]['user'])
		bargs['hideifnotme'] = "";
	    buttonhtml += Mustache.render(tagbuttontemplate, bargs);
	}
	buttonhtml += "</div><br style='margin:1px'>";
    }
    
    targs = {
	'oid': data['_id']['$oid'],
	'tag_html': buttonhtml
    };
    console.log(targs);
    return Mustache.render(tagtemplate, targs);
    
}
    

function GetDataState(data){
    
    if(data==null)
	return "";

    // Hosts
    hosts = {"reader": 0,
             "xe1t-datamanager": 0,
             "midway-login1": 0,
             "tegner-login-1": 0,
             "login": 0,
             "nikhef-srm": 0
	    };

    // status 0: none, 1: transferring/triggering, 2: transferred/triggered
    // 3: processing, 4: processed
    for(i=0; i<data.length; i+=1){
	if(!(data[i]['host'] in hosts))
            continue;
	if(data[i]['status'] == 'error' || hosts[data[i]['host']] == 5)
            hosts[data[i]['host']] = 5;
	else if(data[i]['type'] == 'raw' || data[i]['type'] == 'untriggered'){
            if((data[i]['status'] == 'transferring' || 
		data[i]['status']=='verifying')
               && hosts[data[i]['host']]==0)
		hosts[data[i]['host']] = 1;
            else if(data[i]['status'] == 'transferred' && 
		    (hosts[data[i]['host']] < 2))
		hosts[data[i]['host']] = 2;
	}
	else if(data[i]['type'] == 'processed'){
            if(data[i]['status'] == 'transferring' || 
	       data[i]['status']=='verifying')
		hosts[data[i]['host']] = 3;
            else if(data[i]['status'] == 'transferred')
		hosts[data[i]['host']] = 4;
        }
    }// end for
    // Adjust DAQ
    if(hosts['xe1t-datamanager']==2 || 
       (hosts['xe1t-datamanager']==1 && hosts['reader'] == 0))
	hosts['reader'] = 2;
    
    // Now create the html glyphicon glyphicon-stop
    html = "";
    colors= ["#ff0000", "#ffcc00", "#006600", "#000099", 
	     "#3399ff", "#ff6600"];
    genstatus=["No data", "Transferring", "Transferred", 
	       "Processing", "Processed", "Error"];
   daqstatus=["Untriggered", "Triggering", "Triggered", 
	      "Processing", "Processed", "Error"];
    for(host in hosts){
	status = genstatus[hosts[host]];
	type="glyphicon-stop";
	if(status=="Error")
	    type="glyphicon-exclamation-sign";
	html+="<span class='glyphicon "+type+"'"+
            " title='"+host+": "+status+
	    "' style='color:"+colors[hosts[host]]+
	    ";margin-right:1px'></span>"
    }
    return html;
}
