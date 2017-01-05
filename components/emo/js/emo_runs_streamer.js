// REQUIRES SteamTable.js Mustache.js
function MakeRunsTable(div, url, templatediv, counterdiv){
    
    // Don't allow further searches during this one
    $(".btn-search-runs").prop("disabled", true);

    // The view describes how to make each row
    //var template = $.trim($("#"+templatediv).html());
    var template = "<tr><td style='width:10px'>{{{ link }}}</td><td>{{ number }}</td><td style='width:30px'>{{ date }}</td><td>{{ source }}</td><td>{{ mode }}</td><td>{{ events }}</td><td>{{{ status }}}</td><td style='width:30px'>{{{ tags }}}</td><td style='width:100px'>{{{ top_comment }}}</td></tr>";
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

	var mode = record.reader.ini.name;

	var top_comment = "";
	if("comments" in record && record.comments.length != 0){
	    top_comment = record.comments[0]['text'];
	}
	
	//console.log(template);
	// souce events status tags top_comment
	return Mustache.render(template, {link: link, number: number, 
					 date: datestring, source: source,
					 mode: mode, events: events, 
					  status: status, tags: tags, 
					  top_comment: top_comment});
    };

    var callbacks = {
	"after_add": function(){
            //console.log(counterdiv);
            document.getElementById(counterdiv).innerHTML=this.data.length;
	},
	"stop_streaming": function(){
	    $(".btn-search-runs").prop("disabled", false);
	},
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
            //per_page_select: true,                 
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
    $("#loading_run").hide();
    //$("#detail_window > div").height($(window).height()-50);
  //  $(".runsHider").show("fade", 50);
    //$("#detail_window").show("slide", { direction: "right" }, 200);
    
}
function HideDetail(){
    $("#detail_window").hide("fade", 50);
//    $(".runsHider").hide("fade", 50);
}

function ShowDetail(name, detector){
    
    $("#detail_window > #emobox").height($(window).height()-50);
    $("#loading_run").show();
    $("#detail_window").show("slide", { direction: "right" }, 200, 
			     function(){

    runs_url = "/runs/get_run";
    params = {
	"detector": detector,
	"name": name
    };
    DrawDetailWindow(runs_url, params, 
		     "template_run_header", "run_detail_top", 
		     "template_tags", "template_tagbutton", "run_detail_tags",
		     "template_storage", "template_site", "detail_locations", 
		     "template_comment", "template_comments", "detail_comments",
		     function(){
			 SlideOutDetail()
			 $(".newtagtextclass").on({
			     keydown: function(e) {
				 if (e.which === 32)
				     return false;
			     },
			     change: function() {
				 this.value = this.value.replace(/\s/g, "");
			     }
			 });
		     });});
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
			  storage_div, comment_template, comments_template,
			  comments_div, callback)
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
	$("#"+comments_div).html(DrawCommentsWindow(data, comment_template,
						    comments_template));
	document.getElementById("json").innerHTML="";
        $("#json").jsonView(data,  { collapsed: true });
	callback();      
			      
    });
    
}
function GetColor(string){
    if (string=="transferred" || string=="processing")
	return "#36bc98";
    if(string=="transferring") 
	return "#f9a100";
    if(string == "checking" || string == "verifying")
	return "#8f58f1";
    else
	return "#ec2c35";
}

function DrawCommentsWindow(data, comment_template, comments_template){

    var commenttemplate= $.trim($("#"+comment_template).html());
    Mustache.parse(commenttemplate);
    
    var comments = "";
    if('comments' in data){
	for(i=0; i<data['comments'].length; i+=1){
	    pars = {
		"user": data['comments'][i]['user'],
		"date": DateToString(data['comments'][i]['date']),
		"text": data['comments'][i]['text']
	    }
	    comments+=(Mustache.render(commenttemplate, pars));
	}
    }
    
    pars2 = {
	"comments": comments,
	"oid": data['_id']['$oid'],
	"name": data['name'],
	"detector": data['detector']
    };
    var commentstemplate = $.trim($("#"+comments_template).html());
    Mustache.parse(commentstemplate);
    return Mustache.render(commentstemplate, pars2);
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
	    pars['display_paxversion'] = "";
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
	    user = "autotagger";
	    if ( 'user' in data['tags'][i] && data['tags'][i]['user'] != "" && 
		 data['tags'][i]['user'] != null)
		user = data['tags'][i]['user'];
	    bargs = {
		"tagname": data['tags'][i]['name'],
		'oid': data['_id']['$oid'],
		'detector': data['detector'],
		'name': data['name'],
		'user': user,
		'hideifnotme': 'style="display:none"'
	    };
	    console.log(document.whoami);
	    if(document.whoami == data['tags'][i]['user'] ||
	       document.whoami == "coderre")
		bargs['hideifnotme'] = "style='display:inline;'";
	    buttonhtml += Mustache.render(tagbuttontemplate, bargs);
	}
	buttonhtml += "</div><br style='margin:1px'>";
    }
    
    targs = {
	'oid': data['_id']['$oid'],
	'tag_html': buttonhtml,
	'name': data['name'],
	'detector': data['detector']
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
             "rucio-catalogue": 0,
             "tsm-server": 0,
             "nikhef-srm": 0
	    };

    // status 0: none, 1: transferring/triggering, 2: transferred/triggered
    // 3: processing, 4: processed
    for(i=0; i<data.length; i+=1){
	if(!(data[i]['host'] in hosts))
            continue;
	if(data[i]['status'] == 'error' || hosts[data[i]['host']] == 6)
            hosts[data[i]['host']] = 6;
	else if(data[i]['type'] == 'raw' || data[i]['type'] == 'untriggered'){
            if((data[i]['status'] == 'transferring' || 
		data[i]['status']=='verifying')
               && hosts[data[i]['host']]==0){
		if(data[i]['status']=='verifying')
		    hosts[data[i]['host']]=2;
		else
		    hosts[data[i]['host']] = 1;
	    }
            else if(data[i]['status'] == 'transferred' && 
		    (hosts[data[i]['host']] < 3))
		hosts[data[i]['host']] = 3;
	}
	else if(data[i]['type'] == 'processed'){
            if(data[i]['status'] == 'transferring' || 
	       data[i]['status']=='verifying')
		hosts[data[i]['host']] = 4;
            else if(data[i]['status'] == 'transferred')
		hosts[data[i]['host']] = 5;
        }
    }// end for
    // Adjust DAQ
    if(hosts['xe1t-datamanager']==3 || 
       (hosts['xe1t-datamanager']==1 && hosts['reader'] == 0))
	hosts['reader'] = 3;
    
    // Now create the html glyphicon glyphicon-stop
    html = "";
    colors= ["#ff0000", "#ffcc00", "#9652f1", "#006600", "#000099", 
	     "#3399ff", "#ff6600", "#9652F1"];
    genstatus=["No data", "Transferring", "Verifying", "Transferred", 
	       "Processing", "Processed", "Error", "Verifying"];
   daqstatus=["Untriggered", "Triggering", "Triggered", "Verified", 
	      "Processing", "Processed", "Error", "Verifying"];
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

function NewComment(form){

 //     e.preventDefault();
        // validate
    form_array = $(form).serializeArray();
    name = "";
    detector = "";
    for(i=0;i<form_array.length;i+=1){
	if(form_array[i]['name'] == 'name')
	    name = form_array[i]['value'];
	if(form_array[i]['name'] == 'detector')
	    detector = form_array[i]['value'];
        if(form_array[i]['name'] == "content"
           && form_array[i]['value'] == "")
            return false;
    }
    $.ajax({
        type: "POST",
        url: "/runs/newcomment",
        data: $(form).serialize(),
        success: function(data) {
	    ShowDetail(name, detector);
	    return false;
        }	
    });
    return false;
  };


function RemoveTag(id, name, runname, detector){    
    if(id!="" && name !=""){
	URL="newtag?remove=true;id="+id+";tagname="+name;
	$.ajax({
            type: "GET",
            url: "/runs/newtag",
            data: {
		"remove": true,
		"id": id,
		"tagname": name
	    },
            success: function(data) {
		console.log("SUCCESS");
		console.log(runname);
		console.log(detector);
		ShowDetail(runname, detector);
		return false;
	    },
	    error: function(data){
		console.log(data);
	    },
	});
    }
    return false;
}

function NewTag(form, name, detector){
    arr = $(form).serializeArray();
    var id="";
    var content="";
    console.log(arr);
    for(var x=0;x<arr.length;x+=1){	
	if(arr[x]["name"]=="content")
	    content=arr[x]["value"];
	else if(arr[x]["name"]=="id")
	    id=arr[x]["value"];
    }
    if( content.indexOf(' ') >= 0 ){
	alert("Tags should be one word. Please use the comments tab for more extensive comments.");
	return false;
    }
    
    if(id!="" && content !=""){
	URL="newtag?id="+id+";tagname="+content;
	
	$.get(URL,function(){
	    ShowDetail(name, detector);
	    return false;
	});
    }
    return false;
};
