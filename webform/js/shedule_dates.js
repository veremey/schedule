
/**
 * shedule
 *
 * @version 1.6
 */

var app_days = {
    
    options: {
	apiUrl: '/api/v1/',
	shedule_type: 1,
        shedule_type_name: 'dates',
	lessons_localStorage_name: 'lesson-days-backbone',
	autoHours: 1.5,
	lesson_types: {},
	datepickerOpts: {
            lazyInit: false,
	    datepicker: true,
	    timepicker: false,
	    scrollInput: false,
	    scrollMonth: false,
	    formatDate: 'd.m.Y',
            format: 'd.m.Y',
            dayOfWeekStart: 1,
            allowBlank: true,
	    validateOnBlur: false,
	    closeOnDateSelect: true,
	    yearStart: new Date().getFullYear() - 1,
	    yearEnd: new Date().getFullYear() + 1,
            lang: 'ru',
	    mask: true
        }
    },
    
    init: function(){
        
	var cmp = this;
        
        /* shedule_type */
	$('a','#shedule_type')
	.bind('click',function(e){
	    
	    if ( !shedule.options.loaded ) { return false; }
	    
	    var parent = $(e.target).closest('ul');
	    $('li',parent).removeClass('active');
	    $(e.target).parent('li').addClass('active');
	    
	    var shedule_type = $(e.target).data('type');
	    
	    if ( shedule_type ) {
		cmp.switchShedule( shedule_type );
	    }
	    
	    return false;
	});
        
    },
    
    //Переключение типа расписания
    switchShedule: function( type ){
	
	var cmp = this;
	
	if ( type == cmp.options.shedule_type ) { return false; }
	
	if ( type == 1 ) {
	    
	    app.switchToDays();
	    
	    $('#sheduleTable').show();
	    $('#sheduleTable2').hide();
	    
	} else {
	    
	    $('#sheduleTable').hide();
	    $('#sheduleTable2').show();
	    
	    if( cmp.input_data.teachers.length == 0 ) cmp.input_data.teachers = shedule.input_data.teachers;
	    if( cmp.input_data.lessons.length == 0 ) cmp.input_data.lessons = shedule.input_data.lessons;
	    if( cmp.input_data.auditories.length == 0 ) cmp.input_data.auditories = shedule.input_data.auditories;
	    if ( $.isEmptyObject(cmp.options.lesson_types) ) {
		
		//Типы занятий
		var lesson_types = shedule.input_data.lessontypes;
		for( var i in lesson_types ){
		    if ( lesson_types.hasOwnProperty( i ) ){
			cmp.options.lesson_types[ 'type' + lesson_types[i].type ] = { id: lesson_types[i].type, name: lesson_types[i].typeName };
		    }
		}
		
	    }
	    
	    app.lessons.fetch({reset: true});
	    app.view.restoreAll();
	    
	}
	
	app.options.shedule_type = type;
	
	return true;
    },
    
    
    //Сохранение
    onLessonEdit: function( lessonData ){
        
        if ( !lessonData ) { return; }
	
	var changed = false;
	
	//Добавляем аудиторию в общий список, если её там ещё нет
	if ( lessonData.auditories_json ) {
	    
	    var auditories = $.parseJSON( lessonData.auditories_json );
	    
	    for( var i in auditories ){
		if ( auditories.hasOwnProperty(i) ) {
		    
		    var exists = false;
		    
		    for( var ii = 0; ii < shedule.input_data.auditories.length; ii++ ){
			
			if ( shedule.input_data.auditories[ii].auditory_name == auditories[i].auditory_name ) {
			    var exists = true;
			    break;
			}
			
		    }
		    
		    if ( !exists ) {
			shedule.input_data.auditories.push( auditories[i] );
			changed = true;
		    }
		    
		}
	    }
	    
	    if ( changed ) {
		shedule.sortingData( 'auditories' );
	    }
	    
	}
	
	//Добавляем препода в общий список, если его там ещё нет
	if ( lessonData.teachers_json ) {
	    
	    var teachers = $.parseJSON( lessonData.teachers_json );
	    changed = false;
	    
	    for( var i in teachers ){
		if ( teachers.hasOwnProperty(i) ) {
		    
		    var exists = false;
		    
		    for( var ii = 0; ii < shedule.input_data.teachers.length; ii++ ){
			
			if ( shedule.input_data.teachers[ii].teacher_name == teachers[i].teacher_name ) {
			    exists = true;
			    break;
			}
			
		    }
		    
		    if ( !exists ) {
			shedule.input_data.teachers.push( teachers[i] );
			changed = true;
		    }
		    
		}
	    }
	    
	    if ( changed ) {
		shedule.sortingData( 'teachers' );
	    }
	    
	}
	
    },
    
    //Перевод к виду "По дням недели"
    switchToDays: function(){
	
	var models = app.lessons.toArray();
	var lessons_days = [];
	
	//Убираем все занятия по датам чтобы обновить
	for( var i = 0; i < shedule.data.lessons_days.length; i++ ){
	    
	    lessons_days[i] = {};
	    lessons_days[i].weekday = shedule.data.lessons_days[i].weekday;
	    lessons_days[i].weekdayText = shedule.data.lessons_days[i].weekdayText ? shedule.data.lessons_days[i].weekdayText : null;
	    lessons_days[i].lessons = [];
	    
	    for ( var ii = 0; ii < shedule.data.lessons_days[i].lessons.length; ii++ ) {
		
		var lesson = shedule.data.lessons_days[i].lessons[ii];
		if ( !lesson.dates || lesson.dates.length == 0 ) {
		    lessons_days[i].lessons.push( lesson );
		}
		
	    }
	    
	}
	
	shedule.data.lessons_days = lessons_days;
	
	for( var i in models ){
            if ( models.hasOwnProperty(i) ) {
		
		var attributes = models[i].attributes;
		
		var lesson = {
		    lesson_id: attributes.lesson_id ? attributes.lesson_id : null,
		    parity: 0,
		    auditories: attributes.auditories_json ? $.parseJSON(attributes.auditories_json) : null,
		    time_start: attributes.time_start,
		    time_end: attributes.time_end,
		    date_start: null,
		    date_end: null,
		    dates: attributes.date ? $.map( attributes.date.split(','), function( n, i ) { return $.trim(n); }) : [],
		    last_updated: attributes.last_updated ? attributes.last_updated : null,
		    type: attributes.type,
		    typeName: attributes.typeName,
		    subject: attributes.subject,
		    teachers: attributes.teachers_json ? $.parseJSON(attributes.teachers_json) : null,
		    groups: attributes.group_json ? $.parseJSON(attributes.group_json) : null
		};
		
		
		//Определяем дни недели
		var weekdays = {};
		for( var ii in lesson.dates ){
		    if ( lesson.dates.hasOwnProperty(ii) ) {
			
			var weekday = app.weekDay( lesson.dates[ii] );
			if ( !weekdays['weekday'+weekday] ) {
			    weekdays['weekday'+weekday] = [];
			}
			
			weekdays['weekday'+weekday].push( lesson.dates[ii] );
			
		    }
		}
		
		for( var key in weekdays ){
		    if ( weekdays.hasOwnProperty(key) ) {
			
			var weekday = key.substr(7);
			var d_index = shedule.getWeekIndex(weekday);
			
			if ( d_index > -1 ) {
			    
			    shedule.data.lessons_days[d_index].lessons.push( $.extend({},lesson,{dates:weekdays[key]}) );
			    
			}else{
			    
			    shedule.data.lessons_days.push( { weekday: weekday, lessons: [ $.extend({},lesson,{dates:weekdays[key]}) ] } );
			    
			}
			
		    }
		}
		
	    }
	}
	
	shedule.onDataChange();
	shedule.updateTable();
	
    }
    
}

//Переопределяем Backbone.sync
Backbone.sync = function( method, model, options ) {
    
    //console.log( 'Backbone.sync', method, model, app.lessons );
    
    switch (method) {
	case "read":
	    
	    var lessons_names = [];
	    var resp = [];
	    for( var i = 0; i < shedule.data.lessons_days.length; i++ ){
		
		for( var ii in shedule.data.lessons_days[i].lessons ){
		    if ( shedule.data.lessons_days[i].lessons.hasOwnProperty(ii) ) {
			
			if( shedule.data.lessons_days[i].lessons[ii].dates && shedule.data.lessons_days[i].lessons[ii].dates.length > 0 ){
			    
			    var tmp = $.extend( {}, shedule.data.lessons_days[i].lessons[ii] );
			    tmp.date = shedule.data.lessons_days[i].lessons[ii].dates.join( ', ' );
			    tmp.auditories_json = JSON.stringify( tmp.auditories );
			    tmp.teachers_json = JSON.stringify( tmp.teachers );
			    tmp.group_json = JSON.stringify( tmp.groups );
			    
			    tmp.auditory_name = '';
			    tmp.auditory_address = '';
			    tmp.teacher_id = '';
			    tmp.teacher_name = '';
			    if ( !tmp.typeName ) {
				tmp.typeName = shedule.getLessonTypeName(tmp.type);
			    }
			    
			    //teachers
			    tmp.teacher_name = shedule.getNamesArr( tmp.teachers, 'teacher_name' );
			    
			    //auditories
			    tmp.auditory_name = shedule.getNamesArr( tmp.auditories, 'auditory_name' );
			    
			    //groups
			    tmp.group_id = shedule.getNamesArr( tmp.groups, 'group_name' );
			    
			    delete tmp.auditories, tmp.teachers;
			    
			    var l_name = tmp.subject + '-' + tmp.auditory_name + '-' + tmp.type + '-' + tmp.time_start + '-' + tmp.time_end;
			    if ( $.inArray( l_name, lessons_names ) > -1 ) {
				
				var index = $.inArray( l_name, lessons_names );
				resp[index].dates = $.unique(resp[index].dates.concat(tmp.dates));
				resp[index].date = resp[index].dates.join( ', ' );
				
			    } else {
				
				resp.push( tmp );
				lessons_names.push( l_name );
				
			    }
			    
			}
			
		    }
		}
		
	    }
	    
	break;
	case "create":
	    
	    app.lessons.add(model);
	    app.view.restoreAll();
	    
	break;
    }
    
    if (resp) {
	options.success(resp);
    } else {
	options.error("Record not found");
    }
    
};

$.extend( app, app_days );


