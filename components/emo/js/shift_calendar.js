function MakeSidebar(divname, year){
    // Draws a sidebar with each institute and what
    // shifts they've done/have to do
    var URL = "/management/get_shift_stats/?year=" + year.toString();
    document.getElementById("current_year_column").innerHTML="Shifts "+year.toString();
    $.getJSON(URL, function(data){
	inst_array = [];
	for (var key in data['institutes']['shifts']) {
	    if (data['institutes']['shifts'].hasOwnProperty(key)) {
		entry = data['institutes']['shifts'][key];
		shifts_to_do = entry['shifts']-entry['done']
		entry['net'] = shifts_to_do;
		entry['institute']=key;
		entry['rollover'] = data['institutes']['shifts'][key]['prev_credit'] -
		    data['institutes']['shifts'][key]['prev_owe'];
		if(inst_array.length == 0)
		    inst_array.push(entry);
		else{
		    set=false;
		    for(x=0;x<inst_array.length;x+=1){
			if(shifts_to_do > inst_array[x]['net']){
			    inst_array.splice(x, 0, entry);
			    set=true;
			    break;
			}
		    }
		    if(!set)
			inst_array.push(entry);
		}		
	    }
	}
	console.log(inst_array);
	ret="";
	console.log(data);
	for(i=0;i<inst_array.length;i+=1){
	    ret += "<tr><td>"+inst_array[i]['institute']+"</td>";
	    rollover = inst_array[i]['rollover'];
	    color="#990000";
	    if(rollover>=0)
		color = "#444444";
	    else if(rollover > -4)
		color="#ff9900";
	    ret+="<td><strong style='color:"+color+"'>"+rollover.toString()+"</td>";	   

	    ret +="<td><strong style='color:#990000'>"+inst_array[i]['shifts']+" - </strong><strong style='color:#006600'>"+inst_array[i]['done']+" = </strong>";
	    left = inst_array[i]['shifts'] - inst_array[i]['done'];
	    color="#990000"; 
	    if(left < 2)
		color="#ff9900";
	    if(left<=0)
		color="#006600";
	    ret+="<strong style='color:"+color+"'>"+left+"</strong>";
//	    ret += "<tr><td>"+inst_array[i]['institute']+"</td><td>"+
//		inst_array[i]['shifts']+"</td><td>"+inst_array[i]['done']+
//		"</td><td>"+inst_array[i]['net']+"</td></tr>";	    
	    ret+="</td></tr>";
	}
	document.getElementById(divname).innerHTML=ret;
    });
}

function MakeCalendar(divname, userList){
    var colors = {"free": "#36bc98", 
		  "run coordinator": "#5a54bd", 
		  "taken": "#5992c2",
		  "shifter": "#5992c2",
		  "training": "#ffa500",
		 "credit": "#ff3300"};
    document.userList = userList;
    console.log("Making calendar at " + divname);
    $('#' + divname).fullCalendar(
        {
//	        defaultView: 'weekList',

            eventLimit: true,
            events: '/management/get_shifts', // use the `url` property
            color: 'yellow',    // an option!
            textColor: 'black',  // an option!
            header: {
		left: '',
		center: 'title',
	    },
	    viewRender: function(){
		date=$("#calendar").fullCalendar('getDate');
		MakeSidebar("inst_table_body", date.year());
            },
            error: function() {
		alert('there was an error while fetching events!');
	    },
	    eventRender: function(event, element, view){
		element.find('.fc-time').html("");
		//          element.find('.fc-event-title').html(event.title);
		type = 'free';
		if(event['available']) type='free';
		else type=event.type;//if(calEvent.type=='credit')
		if(event.type=='credit') type='credit';
		element.css('background-color', colors[type]);
		event.color = colors[type];
            },
            eventLimitClick: 'day',	    
            eventClick: function(calEvent, jsEvent, view) {		

		document.getElementById("shift_modal_title").innerHTML = "Week " + moment(calEvent.start, "MM-DD-YYYY").week() + "<strong> "+calEvent.type+"</strong>";
		document.getElementById("shift_modal_start").innerHTML = 
		    moment(calEvent.start, "MM-DD-YYYY").format("MM-DD-YYYY");
		document.getElementById("shift_modal_end").innerHTML=
		    moment(calEvent.end, "MM-DD-YYYY").format("MM-DD-YYYY");
		document.getElementById("shift_modal_institute").innerHTML=calEvent.institute;
		document.getElementById("shift_modal_user").innerHTML=calEvent.shifter;
		if(calEvent.available)
		    document.getElementById("shift_modal_available").innerHTML = 
		    "<strong>Available</strong>";
		else
		    document.getElementById("shift_modal_available").innerHTML = 
		    "<strong>Unavailable</strong>";
		if(calEvent.available){
		    $('#btn_mark_available').attr("disabled", true);
		    $('#btn_sign_up').attr("disabled", false);
		}
		else{
		    $('#btn_sign_up').attr("disabled", true);
		    
		    // Want to allow people to set as available only if allowed
		    console.log(document.userList);
		    console.log(calEvent);
		    for(var key in document.userList){
			console.log(key);
			for(i=0;i<document.userList[key].length;i+=1){
			    if( document.userList[key][i]['username'] == calEvent.shifter )
				$('#btn_mark_available').attr("disabled", false);		    
			}
		    }
		}

		// Set on click event
		$("#btn_sign_up").attr("onclick",
				       "SignUp('"+calEvent.type+"', '"
				       +calEvent.start+"', '"
				       +calEvent.end+"')");
		$("#btn_mark_available").attr("onclick", 
					      "MarkAvailable('"+calEvent.type+"', '"
					      +calEvent.start+"', '"
					      +calEvent.end+"', '"+calEvent.shifter+"', '"+
					     calEvent.institute+"')");
		$("#btn_train").attr("onclick",
                                     "SignUpTrain('"+calEvent.type+"', '"
                                     +calEvent.start+"', '"
                                     +calEvent.end+"')");
		$("#btn_credit").attr("onclick",
				      "SignUpCredit('"+calEvent.type+"', '"
                                      +calEvent.start+"', '"
                                      +calEvent.end+"')");
		// Put at proper location
		var x = (jsEvent.clientX + 20) + 'px',
                    y = (jsEvent.clientY + 20) + 'px';

                if((jsEvent.clientX+20)+$("#ttip").width() > $(window).width())
                   x=$(window).width()-$("#ttip").width() + 'px';
		if((jsEvent.clientY+20)+$("#ttip").height() > $(window).height())
                   y=$(window).height()-$("#ttip").height() + 'px';
                $("#ttip").css('top', y);
                $("#ttip").css('left', x);
                $("#ttip").css('display', 'block');//show();//addClass("show");


            }
	    
        });
       
}

function SignUp(shiftType, shiftStart, shiftEnd){

    $('#id_start_date').val(moment(parseInt(shiftStart)).format("YYYY-MM-DD"));
    $("#id_start_date").prop("readonly", true);    
    $('#id_end_date').val(moment(parseInt(shiftEnd)).format("YYYY-MM-DD"));   
    $("#id_end_date").prop("readonly", true);
    $('#signUpModal').modal('show');

    ret = "";
    ret+="<option value='"+shiftType+"'>"+shiftType+"</option>";
    ret+="<option value='training'>training</option>";
    document.getElementById("id_shift_type").innerHTML=ret;
    document.getElementById("id_remove").checked = false;
    $("#id_remove").val(false);
    
  
}
function SignUpTrain(shiftType, shiftStart, shiftEnd){

    $('#id_start_date').val(moment(parseInt(shiftStart)).format("YYYY-MM-DD"));
    $("#id_start_date").prop("readonly", true);
    $('#id_end_date').val(moment(parseInt(shiftEnd)).format("YYYY-MM-DD"));
    $("#id_end_date").prop("readonly", true);
    $('#signUpModal').modal('show');

    ret = "";
    ret+="<option value='training'>training</option>";
    document.getElementById("id_shift_type").innerHTML=ret;
    document.getElementById("id_remove").checked = false;
    $("#id_remove").val(false);


}

function SignUpCredit(shiftType, shiftStart, shiftEnd){

    $('#id_start_date').val(moment(parseInt(shiftStart)).format("YYYY-MM-DD"));
    $("#id_start_date").prop("readonly", true);
    $('#id_end_date').val(moment(parseInt(shiftEnd)).format("YYYY-MM-DD"));
    $("#id_end_date").prop("readonly", true);
    $('#signUpModal').modal('show');

    ret = "";
    ret+="<option value='credit'>credit</option>";
    document.getElementById("id_shift_type").innerHTML=ret;
    document.getElementById("id_remove").checked = false;
    $("#id_remove").val(false);

}


function MarkAvailable(shiftType, shiftStart, shiftEnd, shifter, institute){
    $('#id_start_date').val(moment(parseInt(shiftStart)).format("YYYY-MM-DD"));
    $("#id_start_date").prop("readonly", true);
    $('#id_end_date').val(moment(parseInt(shiftEnd)).format("YYYY-MM-DD"));
    $("#id_end_date").prop("readonly", true);
    $("#id_institute").val(institute);
    UpdateUserList();
    $("#id_user").val(shifter);
    console.log($("#id_institute").val());
    console.log($("#id_user").val());
    console.log(shifter);

    ret = "";
    ret+="<option value='"+shiftType+"'>"+shiftType+"</option>";
    ret+="<option value='training'>training</option>";
    document.getElementById("id_shift_type").innerHTML=ret;
    document.getElementById("id_remove").checked = true;
    $("#id_remove").val(true);
    $("#sign_up_form").submit();
    
}
