
/**
 * shedule
 *
 * @version 1.6
 */

var app_med = {
    
    options: {
	apiUrl: '/api/v1/',
	shedule_type: 1,
	shedule_type_name: 'cycle',
	lessons_localStorage_name: 'lesson-med-backbone',
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
	
	app_med.options.shedule_type = type;
	
	return true;
    },
    
    
    /**
     * Перевод к виду "По дням недели"
     *
     */
    switchToDays: function(){
	
	shedule.data.lessons_cycle = [];
	var models = app.lessons.toArray();
	
	for( var i in models ){
	    if ( models.hasOwnProperty(i) ) {
		
		var attributes = models[i].attributes;
		var tmp_data = app.getLessonData( attributes );
		
		shedule.data.lessons_cycle.push( tmp_data );
		
	    }
	}
	
	//console.log('switchToDays',shedule.data.lessons_cycle);
	
    },
    
    /**
     * Данные в красивый массив
     *
     */
    getLessonData: function( attributes ){
	
	var get_data = app.parseGetParams();
	
	var output = {
	    time_start: attributes.time_start,
	    time_end: attributes.time_end,
	    subject: attributes.subject,
	    type: attributes.type,
	    dates: [],
	    date_start: attributes.date_start ? attributes.date_start : $('#dates .date-start').val(),
	    date_end: attributes.date_end ? attributes.date_end :  $('#dates .date-end').val(),
	    sixdays: attributes.sixdays,
	    parity: 0
	};
	
	output.auditories = attributes.auditories_json ? $.parseJSON( attributes.auditories_json ) : null;
	output.teachers = attributes.teachers_json ? $.parseJSON( attributes.teachers_json ) : null;
	
	return output;
	
    }
    
    
}

//Переопределяем Backbone.sync
Backbone.sync = function( method, model, options ) {
    
    //console.log( 'Backbone.sync', method, model, app.lessons );
    
    switch (method) {
	case "read":
	    
	    var lessons_names = [];
	    var resp = [];
	    
	    for( var i = 0; i < shedule.data.lessons_cycle.length; i++ ){
		
		var tmp = shedule.data.lessons_cycle[i];
		var date_value = '';
		var auditory_name = '';
		var teacher_name = '';
		
		//teachers
		var separator = '';
		for( var j in tmp.teachers ){
		    if ( tmp.teachers.hasOwnProperty( j ) ) {
			
			teacher_name += separator;
			teacher_name += tmp.teachers[j].teacher_name;
			separator = ', ';
			
		    }
		}
		
		//auditories
		var separator = '';
		for( var j in tmp.auditories ){
		    if ( tmp.auditories.hasOwnProperty( j ) ) {
			
			if ( tmp.auditories[j].auditory_name != 'Нет данных' ) {
			    auditory_name += separator;
			    auditory_name += tmp.auditories[j].auditory_name;
			    separator = ', ';
			}
		    }
		}
		
		var lesson = {
		    subject: tmp.subject,
		    type: tmp.type,
		    typeName: tmp.typeName,
		    date: date_value,
		    date_start: tmp.date_start ? tmp.date_start : '',
		    date_end: tmp.date_end ? tmp.date_end : '',
		    time_start: tmp.time_start,
		    time_end: tmp.time_end,
		    auditory_name: auditory_name,
		    auditory_address: '',
		    auditories_json: JSON.stringify( tmp.auditories ),
		    teacher_id: '',
		    teacher_name: teacher_name,
		    teachers_json: JSON.stringify( tmp.teachers ),
		    sixdays: tmp.sixdays ? true : false,
		    edit: false
		};
		
		resp.push( lesson );
		
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

$.extend( app, app_med );
