// Server calls required:
// 
// UPDATE PLAYLIST (send an updated list an modify the one on the server to be that)
// PULL PLAYLIST (get the list from the server and update this one)
// GET RUN MODES (gets available operating modes)

// Libraries required:
// bootstrapSwitch
// sortable.js
// ply.js

// run field: 1- running, 2- autoplay, 0- not running, no autoplay
var test_data = [

    { "detector": "tpc", "run_mode_tpc": "background", "position": 0, "run": 1,
      "stop_after_minutes": 60, "user": "coderre",
    },
    { "detector": "tpc", "run_mode_tpc": "background", "position": 1, "run": 2,
      "stop_after_minutes": 60,"user":"coderre",
    },
    { "detector": "tpc", "run_mode_tpc": "background", "position": 2, "run": 2,
      "stop_after_minutes": 60,"user":"coderre",
    },
    { "detector": "tpc", "run_mode_tpc": "background", "position": 3, "run": 2,
      "stop_after_minutes": 60,"user":"coderre",
    },
    { "detector": "tpc", "run_mode_tpc": "background", "position": 4, "run": 2,
      "stop_after_minutes": 60,"user":"coderre",
    },

]

function ConfirmCanStartRuns(callback, arg){
    if(document.canstartruns){
	console.log(arg);
	if(arg != null)
	    callback(arg);
	else
	    callback();
	return true;
    }
    else{
	Ply.dialog("alert", "You don't have permission to manipulate the run queue. Request permission in your profile. If you already did request permission try reloading the page.");
	return false;
    }
}

function UpdateServer(callback){
    // later this will update the playlist with the local copy
    // for now we just wait 3 seconds
    //setTimeout(function(){ callback(); }, 3000);
    var updateURL = "/control/set_queue_list";
    console.log("UPDATING SERVER");
    console.log(document.playlist_data);
    $.ajax({
        url: updateURL,
        type: "POST",
        data: JSON.stringify({
            "queue": document.playlist_data,
            //"csrfmiddlewaretoken": csrf_token                                        
        }),
        //dataType: "application/json; charset=utf-8",
	dataType: "text",
	contentType: "application/json",
        success: function (result) {
	    console.log("UPDATED");
            RefreshPlaylist(false);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            if(xhr.status=="200")
                return;
            alert("Failed to update the runs list! The following popups will give more details.");
            alert(xhr.status);
            alert(thrownError);
        }
    });
}

// We have two templates. One for the title bar and one for the body
function InitializePlaylist(title_div, body_div, content_div){
    document.playlist_title_div = title_div;
    document.playlist_body_div = body_div;
    document.playlist_content_div = content_div;
    document.playlist_data = [];
    ShowLoading();
    PullRemoteList();
}
function RefreshPlaylist(quiet){
    if(quiet == false)
	ShowLoading();
     PullRemoteList();
}

function ShowLoading(){
    // Title div will just be an animated gif
    var content_height = $("#"+document.playlist_content_div).innerHeight();
    var title_height = $("#"+document.playlist_title_div).innerHeight();
    var px = content_height - title_height;
    document.getElementById(document.playlist_body_div).innerHTML = 
	"<div class='playlist_body_load' style='width:100%;height:"+
	px.toString()+"px'></div>";
    var px2 = $("#"+document.playlist_title_div).innerWidth() -200;

    document.getElementById(document.playlist_title_div).innerHTML = "<p align='center' style='font-size:24px'>Refreshing</p>";
    //g"<div style='font-size:24px;margin:0;width:100%'>Playlist <div class='playlist_title_load' style='width:"+px2+"px'></div></div>";
}

function PullRemoteList(){
    var url = "/control/get_queue_list";
    //data = test_data;
    console.log("Pull remote");
    $.getJSON(url, function(data){                                                    
	console.log("Got it");
	console.log(data);                                                            
	document.playlist_data = data;       
	document.getElementById(document.playlist_body_div).innerHTML ="";
	document.getElementById(document.playlist_title_div).innerHTML ="";
	SetPlaylist(data);
	SetPlaylistTitle(data);
    });  
}
function StopRun(detector){
    var stopURL = "/control/stop_run";
    console.log("Stopping");
    console.log(detector);
    $.ajax({
        url: stopURL,
	type: "POST",
        data: JSON.stringify({
            "user": document.user,                                                   
            "detector":  detector,            
//	    "csrfmiddlewaretoken": $("[name=csrfmiddlewaretoken]").val()

        }),
	 dataType: "text",
        contentType: "application/json",

        success: function (result) {
	    console.log("Did it!");
            RefreshPlaylist(false);
        },
        error: function (xhr, ajaxOptions, thrownError) {
	        if(xhr.status=="200")
                return;
            alert("Failed to update the runs list! The following popups will give more details.");
            alert(xhr.status);
            alert(thrownError);
        }
    });

}

function ConfirmNoOpenAlerts(callback){
    document.alerts=false;
    if(!document.alerts){
	callback();
	return true;
    }
    Ply.dialog("alert", "Hold it right there. It looks like the DAQ has some open alerts and won't start until they're dealt with. Remember, you have to actually fix the problem before closing the alert!");
    return false;
    
}
function AutoplayToggle(checkbox){
    
    var csr = false;
    vsr = ConfirmCanStartRuns( function(){
	var cna = false;
	cna = ConfirmNoOpenAlerts( function(){	
	    autoplay = 0;
	    if(checkbox.checked){
		console.log("Autoplay on");
		document.autoplay=true;
		autoplay = 2;
	    }
	    else{
		console.log("autoplay off");
		document.autoplay=false;
	    }
	    
	    for(var i=0; i<document.playlist_data.length; i+=1){
		if(document.playlist_data[i]['running'] != 1)
		    document.playlist_data[i]['running'] = autoplay;
	    }
	    
	    // Now update the server
	    $('#autoplay_toggle_checkbox').bootstrapSwitch('toggleDisabled', true);
	    UpdateServer(
		function(){
		    //$('#autoplay_toggle_checkbox').bootstrapSwitch('toggleDisabled', false);
		});
	}); // close confirm no open alerts
	if(!cna)
	    return false;
    }, null); // close confirm can start runs

    if(!csr)
	return false;
}
function SetPlaylistTitle(data){
    // Need to know if a run is playing. If so display its run number, etc
    html = "";
    
    // Add new run button
    html += "<div class='playlist-start-button' style='width:120px' onclick='ConfirmCanStartRuns(NewRun, null)'><span class='glyphicon glyphicon-plus'></span>Add </div>";
    html += "<div class='playlist-stop-button' style='width:120px' onclick='ConfirmCanStartRuns(StopRunMenu, null)'><span class='glyphicon glyphicon-stop'></span>Stop</div>";
    
    first_tpc = null;
    second_tpc = null;
    first_mv = null;
    second_mv = null;
    for(x=0;x<data.length;x+=1){
	if(data[x]['detector'] == 'tpc' && first_tpc == null)
	    first_tpc = data[x]['running'];
	else if(data[x]['detector'] == 'tpc' 
		&& first_tpc != null && second_tpc == null)
	    second_tpc = data[x]['running']
	if(data[x]['detector'] == 'muon_veto' && first_mv == null)
            first_mv = data[x]['running'];
	else if(data[x]['detector'] == 'muon_veto' && 
		first_mv!= null&& second_mv == null)
            second_mv = data[x]['running']
    }
    // Autoplay    
	/*
    if( (data.length==0 && document.autoplay==true) ||
	(data.length==1 && ( data[0]['running'] == 2)) ||
	((data.length==1 && data[0]['running'] == 1) && document.autoplay==true)||
	 (data.length>1 && data[1]['running'] == 2) ){*/
    if( ( first_tpc == null && first_mv == null && document.autoplay == true) ||
	( first_tpc == 2 && first_mv == 2) ||
	( first_tpc == 1 && second_tpc == 2) ||
	( first_mv == 1 && second_mv == 2) ){
	html += "<div class='playlist-play-toggle'>Run DAQ: "+
	    "<input type='checkbox' id='autoplay_toggle_checkbox' checked data-toggle='toggle'></input></div>";
    }
    else{
	html += "<div class='playlist-play-toggle'>Run DAQ: "+
            "<input type='checkbox' id='autoplay_toggle_checkbox' data-toggle='toggle'></div>";
    }
    html+="<div style='position:absolute;left:280px;top:0;line-height:40px;font-size:12px;font-weight:bold'>("+document.superman+")</div>";

    //html += "<div class='playlist-help'><a href='/docs'>Help?</a></div>";
    
    document.getElementById(document.playlist_title_div).innerHTML = html;
    $("#autoplay_toggle_checkbox").bootstrapSwitch({"size": "mini"});
    $("#autoplay_toggle_checkbox").on('switchChange.bootstrapSwitch',
				      function(){ 
					  AutoplayToggle(this);
					  ShowBlocker();
				      }
				     );
    
    
}

function ShowBlocker(){
    $("#ImpatientLoading").show();
    setTimeout(function(){ $("#ImpatientLoading").hide(); }, 30000);
};

function SetPlaylist(data){
    var bodyhtml = "<ul id='playlist_ul' style='padding-left:0px;'>";
    for(var i=0; i<data.length; i+=1){
	var c = 'song';
	if(data[i]['running']!=1)
	    c += ' track';
	var row = "<li class='"+c+"' value='"+data[i]['position']+
	    "' style='line-height:40px;height:40px;list-style:none;border-style:solid;border-width:1px;border-color:#aaaaaa;position:relative;border-right:0;position:relative;'>";
	if(i!=0 && data[i]['running']!=1) // can't move top element or any rnning element
	    row += "<div class='playlist-drag-handle'><span class='glyphicon glyphicon-menu-hamburger handle' stlye='font-size:20px;z-index:50;'></span></div>";
	//if(data[i]['running']==0)
	//row += "<div class='playlist-start-button control' onclick='StartFirstRun()'><span class='glyphicon glyphicon-play'></span></div>";
	//if(data[i]['running']==1)
	//row += "<div class='playlist-stop-button control' onclick='ConfirmCanStartRuns(StopRun, "+'"'+data[i]['detector']+'"'+")'><span class='glyphicon glyphicon-stop'></span></div>";
	
	row += "<div style='position:absolute;font-size:53px;top:0;left:30px;height:50px;color:#dadaff;width:10px;z-index:0;'>" + (i+1).toString() + " </div>";
	if(data[i]['detector'] == 'tpc')
	    row += "<div class='playlist-run-name'>"+data[i]['run_mode_tpc']+"</div>";
	else if(data[i]['detector'] == 'muon_veto')
	    row += "<div class='playlist-run-name'>"+data[i]['run_mode_mv']+"</div>";
	else if(data[i]['detector'] == 'all')
	    row += "<div class='playlist-run-name'>"+data[i]['run_mode_tpc']+"/"+data[i]['run_mode_mv']+"</div>";


	row += "<div class='playlist-run-time'>"+GetTimeHMS(data[i]['stop_after_minutes'])+"</div>";

	// Badges to indicate which detector
	console.log(data[i]);
	row += "<div class='badge-div' style='margin-top:5px'>";
	if(data[i]['running'] == 1)
	    row+="<span class='label label-success'>Running</span>&nbsp;"
	else if(data[i]['running'] == 2)
	    row+="<span class='label label-warning'>Queued</span>&nbsp;"
	if(data[i]['detector'] == 'tpc')
            row += "<span class='label label-primary'>TPC</span>";
        else if(data[i]['detector'] == 'muon_veto')
            row += "<span class='label label-default'>Muon Veto</span>";
        else if(data[i]['detector'] == 'all')
            row += "<span class='label label-danger'>Combined</span>";
	row += "</div>";

	if(i!=0 || data[i]['running']==0)
	    row+="<span class='js-remove'><span class='glyphicon glyphicon-trash'></span></span>";
	row += "</li>";
	bodyhtml+=row;
    }
    bodyhtml+="</ul>";
    document.getElementById(document.playlist_body_div).innerHTML=bodyhtml;
    var el = document.getElementById('playlist_ul');


    // Here is the fancy drag and drop list
    var sortable = Sortable.create(el, {
	filter: '.js-remove',
	handle: '.playlist-drag-handle',
	draggable: '.track',
	// REMOVE AN ITEM
	onFilter: function (evt) {
	    console.log(evt.item);
	    console.log(evt.item.parentNode);
	    ConfirmCanStartRuns(function(){
		var idnum = parseInt(evt.item['value']);
		for(x=0;x<document.playlist_data.length;x+=1){        
                    if(idnum == document.playlist_data[x]['position'] ){            
			document.playlist_data.splice(x, 1);                                    
			break;                                                             
                    }                                                              
		} 		
		ShowLoading();
		UpdateServer(RefreshPlaylist);
	    }, null);
	    //list = $("#playlist_ul");
	    
	    //var it = list.closest(evt.item); // get dragged item
	    //console.log(it);
	    /*for(x=0;x<table_data.length;x+=1){                                 
              if(idnum == table_data[x]['position'] ){                       
              table_data.splice(x, 1);                                   
              break;                                                     
              }                                                              
              } */ 
	    //it && it.parentNode.removeChild(it);
	},

	// MOVE AN ITEM
	onEnd: function (/**Event*/evt) {
	    if(!ConfirmCanStartRuns(function(){
		
		document.playlist_data = document.playlist_data.move(evt.oldIndex,
								     evt.newIndex);
		//SetPlaylist(document.playlist_data);
		ShowLoading();
		UpdateServer(RefreshPlaylist);

	    })){
		RefreshPlaylist();
	    };
	},
	
    });
}

//function ShowAskSaveChanges(){
//    return;
//}

function GetTimeHMS(timeminutes){
    if(timeminutes<0)
        return "active";
    if(timeminutes==0)
        return "&infin;";
    hours = Math.floor(timeminutes/60);
    minutes = Math.floor((timeminutes-(60*hours)));
    return  ("0" + hours).slice(-2) +":"+("0" + minutes).slice(-2);
}

Array.prototype.move = function (old_index, new_index) {            
    if (new_index >= this.length) {                           
        var k = new_index - this.length;
        while ((k--) + 1) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this; 
}; 

function StopRunMenu(){
    console.log("HERE");
	html="<div class='row'><div class='col-xs-12' style='margin-top:20px'><button style='width:200px;height:40px;font-size:25px;display:block;margin:auto;background-color:#5992c2;' class='detbtn btn btn-primary btn-large' value='tpc'>TPC</button></div>"+
	    "<div class='row'><div class='col-xs-12' style='margin-top:20px'><button style='width:200px;height:40px;font-size:25px;display:block;margin:auto;background-color:#5992c2;' class='detbtn btn btn-primary btn-large' value='muon_veto'>Muon Veto</button></div>"+
	    "<div class='row'><div class='col-xs-12' style='margin-top:20px'><button style='width:200px;height:40px;font-size:25px;display:block;margin:auto;background-color:#5992c2;' class='detbtn btn btn-primary btn-large' value='all'>Both</button></div>";
	 document.stop_element = new Ply({
            el: html, // HTML-content

            effect: "fade", // or ["open-effect:duration", "close-effect:duration"]
            //effect: ["fade:250", "fade:1000"],
            layer: { width: "300px",
                     height: '230px'}, // default css

            overlay: { // defaults css
            opacity: 0.0,
            backgroundColor: "#000"
        },

            flags: { // defaults
                closeBtn: true, // presence close button "
                //          hideLayerInStack: true,
            },
            onaction: function (ui) {},
        });
 document.stop_element.open().always(function () {
            $('.detbtn').click(function(){
if(this.value == "tpc" || this.value=="muon_veto" || this.value=="all")
StopRun(this.value);
});
});
}
			
// ADD NEW RUN
function NewRun(){

    ConfirmCanStartRuns(function(){
	html = "<div class='row'><div class='col-xs-12' style='margin-top:20px;'><button style='width:200px;height:40px;font-size:25px;display:block;margin:auto;background-color:#5992c2;' class='detbtn btn btn-primary btn-lg' data='tpc' value='tpc'>TPC</button></div>"+
	    "<div class='col-xs-12' style='margin-top:20px;'><button style='width:200px;height:40px;font-size:25px;display:block;margin:auto;background-color:#4fa783;'class='btn btn-xl btn-info detbtn' value='muon_veto'>MuonVeto</button></div>"+
	    "<div class='col-xs-12' style='margin-top:20px'><button class='btn btn-xl btn-info detbtn' style='width:200px;height:40px;font-size:25px;display:block;margin:auto;background-color:#5a54bd;' value='all'>Combined</button></div></div>";
	document.ply_element = new Ply({
	    el: html, // HTML-content
	    
	    effect: "fade", // or ["open-effect:duration", "close-effect:duration"]
	    //effect: ["fade:250", "fade:1000"],
	    layer: { width: "300px",
		     height: '230px'}, // default css
	    
	    overlay: { // defaults css
            opacity: 0.0,
            backgroundColor: "#000"
	},
	    
	    flags: { // defaults
		closeBtn: true, // presence close button "
		//	    hideLayerInStack: true,
	    },
	    onaction: function (ui) {console.log(ui);},
	});
	
	document.ply_element.open().always(function () {
	    $('.detbtn').click(function(){
		console.log("Clicked " + this.value );
		var run_doc = {};
		var butt = this;
		document.new_run_doc = {};
		GetGenOptions( function(){
		    if(butt.value == 'tpc' || butt.value == 'all'){
			GetTPCOptions(
			    function(){
				if(butt.value == 'all'){
				    document.new_run_doc['detector'] = 'all';
				    GetMuonVetoOptions(
					function(){
					    console.log(document.new_run_doc);
					    for(x=0;
						x<document.
						new_run_doc['repeat_n_times'];
						x+=1){
						AddPosition();
						document.playlist_data.push(
						    document.new_run_doc);
					    }
					    ShowLoading();
					    UpdateServer(RefreshPlaylist);
					});
				}
				else{
				    document.new_run_doc['detector'] = 'tpc';
				    console.log(document.new_run_doc);
				    for(x=0;
					x<document.new_run_doc['repeat_n_times'];
					x+=1){
					AddPosition();
					document.playlist_data.push(
					    document.new_run_doc);
				    }
				    ShowLoading();
				    UpdateServer(RefreshPlaylist);
				}
			    });
		    }
		    else{
			document.new_run_doc['detector'] = 'muon_veto';
			GetMuonVetoOptions(
			    function(){
				console.log(document.new_run_doc);
				for(x=0;
                                    x<document.new_run_doc['repeat_n_times'];
                                    x+=1){
				    AddPosition();
				    document.playlist_data.push(
					document.new_run_doc);
				}
				ShowLoading();
				UpdateServer(RefreshPlaylist);
			    });
		    }	    
	    });
	    });
	});
    });
}

function AddPosition(){
    // Adds a unique ID to the new_run_doc
    var lowest = -1;
    for(var x=0;x<document.playlist_data.length;x+=1){
	if(document.playlist_data[x]['position'] > lowest)
	    lowest = document.playlist_data[x]['position'];
    }
    document.new_run_doc['position'] = lowest+1;
    console.log("ADDED NEW POSITION");
    console.log(lowest+1);
}
function GetGenOptions(callback){
    var html= "<div class='row'><div class='col-xs-12'><h3>Run Options</h3></div></div><hr>"+
	"<div class='row' style='margin-top:10px'>"+
	"<div class='col-xs-6'><strong>Starting user:</strong></div>"+
        '<div class="col-xs-6">'+document.user+'</div>'+
        '<input class="hidden" name="user" value="'+document.user+'">'+
        '</div>'+
	'<div class="row">'+
	'<div class="col-xs-6">'+
        '<strong data-toggle="tooltip"'+
	'title="This allows you to override any warnings. It is recommended to only check this option if you know what the warnings are, why they are there, and why you can safely override them."'+
        'data-placement="right">Force this run to start:'+
        '</strong>'+
        '</div>'+
        '<div class="col-xs-6"><input type="checkbox" name="override">'+
        '&nbsp; (Not recommended)</div>'+
        '</div>'+
        '<div class="row" style="margin-top:2px">'+
        '<div class="col-xs-6">'+
        '<strong data-toggle="tooltip"'+
        'title="If you want the run to stop automatically you can put the number of minutes the run should go in this line. If you set it to zero the run will go until you stop it." data-placement="right">Stop after minutes:</strong>'+
	'</div><div class="col-xs-6">'+
        '<input type="number" step="1" min="0" max="1440" value="0" name="stop_after_minutes">&nbsp;<strong>(minutes)</strong></div>'+
        '</div><div class="row" style="margin-top:2px">'+
        '<div class="col-xs-6"><strong data-toggle="tooltip"'+
        'title="If you want to run the same type of run several times in a row, use this input. Note that it only makes sense if you set (stop after minutes) above. If the run is manually stopped it will not restart"'+
        'data-placement="right">Repeat n times:</strong>'+
        '</div><div class="col-xs-6">'+
        '<input type="number" step="1" name="repeat_n_times" value="1" min="1" max="10">&nbsp;<strong>(repeats)</strong></div>'+
        '</div><div class="row" style="margin-top:2px">'+
        '<div class="col-xs-6"><strong>Comment:</strong></div>'+
        '<div class="col-xs-6"><textarea form="run_start_form" rows="4" name="comment"></textarea></div>'+
        '</div></div>'+
	"<div class='col-xs-12' style='margin-top:20px;'><button style='width:200px;height:40px;font-size:25px;display:block;margin:auto;background-color:#5992c2;' class='genbtn btn btn-primary btn-lg' data='gen' value='gen'>Next</button></div>";
    
    document.ply_element.close();
    document.ply_element = new Ply({
	el: html, // HTML-content                                                     
        effect: "fade", // or ["open-effect:duration", "close-effect:duration"]       
        layer: { width: "500px",
		 height: '400px'}, // default css                                     
        overlay: { // defaults css                                                    
            opacity: 0.0,
            backgroundColor: "#000"
        },
        flags: { // defaults                                                          
            closeBtn: true, // presence close button "                                
      //      hideLayerInStack: true,
        },
        onaction: function (ui) {console.log(ui);},
    });
    document.ply_element.open().always(function () {
	$(".genbtn").click(function(){
            document.new_run_doc['stop_after_minutes'] = 
		parseInt($( "input[name='stop_after_minutes']" ).val());
	    document.new_run_doc['repeat_n_times'] = 
		$( "input[name='repeat_n_times']" ).val();
	    document.new_run_doc['user'] = document.user;
	    document.new_run_doc['comment'] = 
		$( "textarea[name='comment']" ).val();	    
	    document.new_run_doc['command'] = "Start";
	    document.new_run_doc['run_mode_tpc'] = "";
	    document.new_run_doc['run_mode_mv'] = "";
	    

	    if($('#autoplay_toggle_checkbox').prop('checked'))
		document.new_run_doc['running'] = 2;
	    else
		document.new_run_doc['running'] = 0;
	    document.new_run_doc['override'] = 0;
	    if($('input[name="override"]').prop('checked'))
		document.new_run_doc['override'] = 1;

            callback();               
	});   
    });
  /*
    console.log(run_doc);
    document.ply_element.swap(
	{ 
	    el: html,
	    overlay: { // defaults css                                                     
		opacity: 0.6,
		backgroundColor: "#000"
            },
	    flags: { // defaults   
		closeBtn: true, // presence close button 
	    },
	    
            onaction: function (ui) {console.log(ui);},
	    
	}, "3d-flip");
	    
    $(".tpcbtn").click(function(){
	callback(run_doc);
    });	    
*/    
}
function GetTPCOptions(callback){
    GetDetOptions("tpc", callback);
}
function GetDetOptions(det, callback){
    // Get run modes
    var run_mode_list_url = "/config/fetch_mode_list";
    names = {"tpc": "TPC", "muon_veto": "Muon Veto"};
    shorts = {"tpc": "tpc", "muon_veto": "mv"};
    mode = [];
    $.getJSON(run_mode_list_url, function(data){
	if(data!=null && det in data){
	    for(x=0;x<data[det].length;x++)
		mode.push(data[det][x]);
	}
	    
	var html= "<div class='row'><div class='col-xs-12'><h3>"+names[det]+" Options</h3></div></div><hr>"+
	    '<div class="row"><div class="col-xs-3"><strong>Mode:</strong></div>'+
            '<div class="col-xs-9">'+
	    '<select id="run_mode_'+shorts[det]+'" name="run_mode_'+shorts[det]+'">';
	for(i=0;i<mode.length;i+=1)
	    html+="<option value='"+mode[i]+"'>"+mode[i]+"</option>";
	html+='</select></div></div>'+
	    '<div class="row" style="margin-top:30px"><div class="col-xs-6">'+
	    '<strong data-toggle="tooltip" title="Automatically adjust the DAC offset for each channel to optimize the dynamic range. Recommended to leave this on." data-placement="right">Do baselines:</strong></div>'+
            '<div class="col-xs-6"><label>'+
            '<div class="col-xs-6"><input type="checkbox" checked name="baselines_'+det+'">'+
            '</div></label></div></div>'+
	    "<div class='col-xs-12' style='margin-top:20px;'><button style='width:200px;height:40px;font-size:25px;display:block;margin:auto;background-color:#5992c2;' class='btn btn-primary btn-lg detbtn'>OK</button></div></div>";
	document.ply_element.close();
	document.ply_element = new Ply({
            el: html, // HTML-content                                                     
            effect: "fade", // or ["open-effect:duration", "close-effect:duration"]    
            layer: { width: "450px",
                     height: '250px'}, // default css                                     
            overlay: { // defaults css                                                    
	        opacity: 0.0,
		backgroundColor: "#000"
            },
            flags: { // defaults                                                          
		closeBtn: true, // presence close button "                                
		
            },
        onaction: function (ui) {console.log(ui);},
	});
	document.ply_element.open().always(function () {
            $(".detbtn").click(function(){
		document.new_run_doc['run_mode_'+shorts[det]] =
                    $( "select[name='run_mode_"+shorts[det]+"']" ).val();
		if($( "input[name='baselines_"+det+"']" ).prop('checked'))
		    document.new_run_doc['baselines_'+det] = 1;
		else
		    document.new_run_doc['baselines_'+det] = 0;
		
		callback();
            });
	});
    });
}

function GetMuonVetoOptions(callback){
    GetDetOptions("muon_veto", callback);
}
/*
    var html= "<div class='row'><div class='col-xs-12' style='margin-top:20px;'><button style='width:200px;height:40px;font-size:25px;display:block;margin:auto;background-color:#5992c2;' class='btn btn-primary btn-lg mvbtn' data='tpc' value='tpc'>OK</button></div></div>";
    document.ply_element.close();
    document.ply_element = new Ply({
	el: html, // HTML-content                                                     
        effect: "3d-flip", // or ["open-effect:duration", "close-effect:duration"]  
                                                                                      
        layer: { width: "300px",
                 height: '230px'}, // default css                                     
	overlay: { // defaults css                                                    
            opacity: 0.0,
            backgroundColor: "#000"
        },
        flags: { // defaults                                                          
            closeBtn: true, // presence close button "                                
      //      hideLayerInStack: true,                                                  
        },
        onaction: function (ui) {console.log(ui);},
    });
    document.ply_element.open().always(function () {
        $(".mvbtn").click(function(){
	    callback();
        });
    });
*/
/*    document.ply_element.swap(
        { el: html,
          overlay: { // defaults css                                  
                                          
            opacity: 0.6,
            backgroundColor: "#000"
          },
	  onaction: function (ui) {console.log(ui);},

        }, "3d-flip").always(
        function(){console.log("HERE");}
        );*/
//}

/*
    console.log("NewRun");
    Ply.dialog({
	 "flags": { // defaults
             "closeBtn": true,
	 },
	"init-state": {
            ui: "alert",
            data: [
		{
		    text: "Start a new run",
		    next: "tpc",
		},
		{
		    text: "Muon veto run",
		    next: "muon_veto"
		}
	    ],
		
	    //ok: "muon_veto",
	    //cancel: "combined",
            nextEffect: "3d-flip[180,-180]"
	},
	
	"tpc": {
            ui: "confirm",
            data: {
		text: "TPC solo run",
		ok: "Exit",     // button text
		cancel: "Back"
            },
            back: "init-state",
            backEffect: "3d-flip[-180,180]"
	},
	"muon_veto": {
            ui: "confirm",
            data: {
                text: "Muon veto solo run",
                ok: "Exit",     // button text                                         
                cancel: "Back"
            },
            back: "init-state",
            backEffect: "3d-flip[-180,180]"
        },
	"cobined": {
	    ui: "confirm",
            data: {
                text: "Combined run",
                ok: "Exit",     // button text                                         
                cancel: "Back"
            },
            back: "init-state",
            backEffect: "3d-flip[-180,180]"
        },
    }).always(function (ui) {
	if (ui.state) {
	    console.log("OK");
            // OK
	} else {
	    console.log("CANCEL");
            // Cancel
            // by.ui 'overlay', 'x', 'esc'
	}
    }); 

*/    
//}
/*





var table_data = null;
var table_data_backup = null;
var thediv = null;
var editMode = false;
var updateURL = "";
var csrf_token = "";

function UpdateTable(json_data){
    var html_table = "";
    for(x=0; x<json_data.length; x+=1)
	html_table+=GetTableRowHTML(json_data[x], x);
    return html_table;
}
function ClearQueue(button){
    var parentTable = $(button).closest("table");
    InitiateEditMode(thediv);
    table_data = [];
    SaveTable(button);
}

function GetTimeHMS(timeminutes){
    if(timeminutes<0)
	return "active";
    if(timeminutes==0)
	return "&infin;";
    hours = Math.floor(timeminutes/60);
    minutes = Math.floor((timeminutes-(60*hours)));
    //seconds = 0 //timeseconds - (hours*3600) - (minutes*60);
    return  ("0" + hours).slice(-2) +":"+("0" + minutes).slice(-2);// +":"+("0" + seconds).slice(-2);
}
function GetTableRowHTML(json_entry, index){
    console.log(json_entry);
    rowstyle="";
    if(json_entry['running'] == 1)
      rowstyle = "class='success'";
    var html = "<tr "+rowstyle+" id='row_"+json_entry['position'].toString()+
	"'>";
    var mode = json_entry['run_mode_tpc']
    if (json_entry['detector'] == 'muon_veto')
	mode = json_entry['run_mode_mv']
    html += "<td>" + mode + "</td>";
    html += "<td>" + json_entry['detector'] + "</td>";
    html += "<td>" + json_entry['user'] + "</td>";
    html += "<td>" + GetTimeHMS(json_entry['stop_after_minutes']) + "</td>";
    html += "<td style='padding-top:3px;padding-bottom:0;height:100%;padding-right:0;line-height:100%' id='"+json_entry['position']+"_ctl'>" + GetButtonHTML(index) + "</td>";
    return html;
}


//  Clicking the trash icon prompts a 'yes really or j/k' dialog inline.
//  If the user confirms the row is remove and the request is sent to the server.
//  If the user does not confirm the row stays and nothing happens.

function LoadTable(table_div, url, uurl, csrf){
    // here's where you'll put the ajax call
    updateURL=uurl;
    csrf_token = csrf;
    // If someone edits don't reload the table
    if(editMode) return;

    console.log(url);
    $.getJSON(url, function(data){
	console.log(data);
	table_data = data;
	console.log(table_data);
	ReloadTable(table_div);
    });
}
function SendUpdate(data_to_send, csrf_token){

    // Ajax baby
    console.log(updateURL);
    $.ajax({
        url: updateURL,
        type: "POST",
        data: JSON.stringify({
	    "queue": data_to_send,
	    //"csrfmiddlewaretoken": csrf_token
	}),
        dataType: "application/json; charset=utf-8",
        success: function (result) {
            ReloadTable(thediv);
        },
        error: function (xhr, ajaxOptions, thrownError) {
	    if(xhr.status=="200")
		return;
	    alert("Failed to update the runs list! The following popups will give more details.");
            alert(xhr.status);
            alert(thrownError);
        }
    });

}

function ReloadTable(table_div){
    thediv = table_div;
    console.log("RELOAD: HERE");
    console.log(table_data);
    document.getElementById(table_div).innerHTML = UpdateTable(table_data);

    $('.glyphicon-arrow-up').on('click', function(){
	InitiateEditMode(thediv);
	if(table_data==null)
	    return;
	var tr = $(this).closest("tr");
	var idnum = parseInt($(tr)[0]['id'].substring(4));
	
	for(x=0;x<table_data.length;x+=1){
	    if(idnum == table_data[x]['position'] && x!=0){
		table_data = table_data.move(x, x-1);
		break;
	    }
	}
	ReloadTable(thediv);
    });
    $('.glyphicon-arrow-down').on('click', function(){
	InitiateEditMode(thediv);
	if(table_data==null)
	    return;
	var tr = $(this).closest("tr");
	var idnum = parseInt($(tr)[0]['id'].substring(4));
	for(x=0;x<table_data.length;x+=1){
	    if(idnum == table_data[x]['position'] && x!=table_data.length-1){
		table_data = table_data.move(x, x+1);
		break;
	    }
	}
	ReloadTable(thediv);
    }); 
    
    $('.glyphicon-trash').on('click', function(){
	InitiateEditMode(thediv);
	
	var td = $(this).closest("td");

	$(td).fadeOut(100, function(){
	    //var tr = $(this).closest("tr");
	    //var id = $(tr)[0]['id'];
	    //document.getElementById($(this)[0]['id']).innerHTML = GetReallyRemHTML(id);
	    var id = $(this)[0]['id']; 
	    $(this).html(GetReallyRemHTML(id)).fadeIn(100);
	    
	    
	    $('.cancelRemove').on('click', function(){
		var td = $(this).closest("td");
		$(td).fadeOut(100, function(){
		    var tr = $(this).closest("tr");
		    var id = $(tr)[0]['id'];
		    $(this).html(GetButtonHTML(id, 2)).fadeIn(100, ReloadTable(thediv));
		});
	    });
	    
	    $('.yesreally').on('click', function(){
	    console.log("HERE!");
		var tr = $(this).closest("tr");
		$(tr).children('td').animate({
		    'font-size': 0,
		    opacity:0,
		    height:0,
		    padding:0
		}, function(){
		    var id = $(tr)[0]['id'];	
		    $(tr).remove();
		    // Remove the data
		    var idnum = parseInt($(tr)[0]['id'].substring(4));		    
		    for(x=0;x<table_data.length;x+=1){
			if(idnum == table_data[x]['position'] ){
			    table_data.splice(x, 1);
			    break;
			}
		    }    

		});
		console.log("Removing row " + id.toString());
		
	    });   
	    
    });
	
	
    });

    
} // end LoadTable


//  HTML for up/down/trash buttons and confirm buttons

function GetReallyRemHTML(){
    return ( "<div class='row'><button class='cancelRemove btn btn-mini btn-danger' style='padding:3px'>Cancel</button>&nbsp;<button class='yesreally btn btn-mini btn-info' style='padding:3px'>Remove</button></div>");
    
}
function GetButtonHTML(index){
    ret = "";
    if(index==0)
      return ret;
    if(index>=2)
	ret+= "<span style='height:100%;font-size:1.6em' class='moveup glyphicon glyphicon-arrow-up'></span>&nbsp;";
    else if(index==1)
	ret+="<span style='height:100%;font-size:1.6em;color:#888888' class='glyphicon glyphicon-arrow-up'></span>&nbsp;";
    ret+="<span style='font-size:1.6em' id='1_down' class='movedown glyphicon glyphicon-arrow-down'></span>&nbsp;<span style='font-size:1.6em' id='1_rm' class='glyphicon glyphicon-trash' data-toggle='tooltip' data-placement='left' data-original-title='asdasd löschen' aria-hidden='true'></span></td>";
    return ret;
}

function InitiateEditMode(tablediv){
    editMode = true;
    if(table_data_backup == null)
	table_data_backup = table_data.slice();
    console.log(table_data_backup);
    var parentTable = $("#"+tablediv).parent();
    //parentTable.find($(".edit_mode")).css("display", "inline");
    $("#run_queue_edit_mode").fadeIn(500);
    //css("display", "inline");

}
function SaveTable(button){
    var parentTable = $(button).closest("table");
    console.log("RUN SAVE FUNCTION");
    table_data_backup = null;
    //var parentTable = tablediv.parent();
    //parentTable.find($(".edit_mode")).css("display", "none");
    $("#run_queue_edit_mode").fadeOut(500);//css("display", "none");
    var update_table = [];
    for(doc in table_data){
	if(doc['running'] == 0)
	    update_table.push(doc);
    }
    console.log("Sending this table");
    console.log(update_table);
    SendUpdate(update_table, csrf_token);
    editMode=false;
}
function DiscardChanges(button){
    var parentTable = $(button).closest("table");
    console.log(table_data);
    table_data = table_data_backup.slice();
    table_data_backup = null;
    console.log(table_data);
    //var parentTable = tablediv.parent();
    $("#run_queue_edit_mode").fadeOut(500);//css("display", "none");
    ReloadTable(thediv);
    editMode=false;
    
}      

Array.prototype.move = function (old_index, new_index) {
    if (new_index >= this.length) {
	var k = new_index - this.length;
	while ((k--) + 1) {
	    this.push(undefined);
	}
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this; // for testing purposes
};
*/
