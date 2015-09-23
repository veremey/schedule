
/**
 * Shedule - session
 *
 * @version 1.6
 */

var app = {
    
    options: {
        
        apiUrl: '/api/v1/',
        lessons_localStorage_name: 'lesson-backbone',
        lesson_types_arr: [ 7, 6, 4, 19 ],
	autoHours: 4,//Сколько часов прибавлять для окончания занятия
        lesson_types: {
            type7: { id: 7, name: 'Экзамен' },
            type6: { id: 6, name: 'Зачет' },
            type4: { id: 4, name: 'Консультация' },
            type19: { id: 19, name: 'Курсовая работа' }
	},
        
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
    
    input_data: {
	teachers: [],
	lessons: [],
	groups: [],
	auditories: []
    },
    
    data: {
	lessons_days: [],
        faculties: [],
	teacher: [],
	auditory: [],
	group: []
    },
    
    groupLocalStorage: new Backbone.LocalStorage("group-backbone"),
    
    init: function(){
        
        var data = app.parseGetParams();
	if( (data.idFac == undefined) || (data.univer == undefined) || (data.fac == undefined) ){
	    document.location.href = 'step1.html';
	}
        
        //Данные с сервера
        this.getData( data.univer, 'teachers' );
	this.getData( data.univer, 'lessons' );
	this.getData( data.univer, 'auditories' );
        this.getSavedLessons();
        
        $('#wrapper-form input[name="shedule_type"]')
	.bind( 'click', function(){
	    var query_str = document.location.href.substr(document.location.href.indexOf('?'));
	    console.log($(this).val());
	    if( $(this).val() == '1' ){
                document.location.href = '/webform/step2.html' + query_str;
	    }else if ( $(this).val() == '2' ) {
		document.location.href = '/webform/step2_med.html' + query_str;
	    }else if ( $(this).val() == '3' ) {
		document.location.href = '/webform/step2_ses.html' + query_str;
	    }
	});
        
        $('.modal-overlay,.modal .btn-cancel').bind( 'click', function(e){
		$('.modal-overlay').hide();
		$('.modal').hide();
		return false;
	    }
	);
        
        $('#sheduleSend').bind( 'click', app.sheduleSend );
        
        app.addPlaceInit();
        
        //Новое расписание
	$('.btn-new,.btn-ok,.btn-cancel','#btn-new-shedule').bind( 'click', function(){
	    if ( $(this).is('.btn-new') ) {
		$(this)
		.hide()
		.nextAll().show();
	    }else{
		$('.btn-new','#btn-new-shedule')
		.show()
		.nextAll().hide();
		if ( $(this).is('.btn-ok') ) {
                    app.cleanShedule();
		    app.onDataChange();
		}
	    }
	    return false;
	});
        
    },
    
    loading: function( active ){
	
	if ( $('#loading').size() == 0 ) {
	    $(document.body).append('<div id="loading">Пожалуйста, подождите...</div>');
	}
	
	setTimeout( function(){
	    $('#loading').css( 'display', ( active ? 'block' : 'none' ) );
	}, ( active ? 0 : 500 ) );
	
    },
    
    cleanShedule: function(){
	
        _.invoke(app.lessons.toArray(), 'destroy');
	
	var get_data = app.parseGetParams();
	
	app.groupLocalStorage._clear();
        app.groupLocalStorage.create( { id: parseInt( get_data.idGroup ) } );
	
    },
    
    /**
     * Запрашиваем сохраненные занятия
     *
     */
    getSavedLessons: function(){
        
        var group_data = app.groupLocalStorage.findAll();
	if ( group_data ) { group_data = group_data[0]; }
        var getData = app.parseGetParams();
	var groupId = getData.idGroup ? parseInt( getData.idGroup ) : 0;
	
	if ( groupId ) {
	    
	    app.loading(true);
	    
	    $.getJSON( app.options.apiUrl + 'groups/' + groupId, function( response ){
		
		if( response.success && response.data.days && response.data.days.length > 0 ){
                    
                    var lessons = [];
                    
                    for( var i in response.data.days ){
                        if ( response.data.days.hasOwnProperty(i) ) {
                            
                            for( var ii in response.data.days[i].lessons ){
                                if ( response.data.days[i].lessons.hasOwnProperty(ii) ) {
                                    
                                    var type = response.data.days[i].lessons[ii].type;
				    
                                    if ( $.inArray( type, app.options.lesson_types_arr ) > -1 ) {
                                        
					var date_value = '';
					if ( response.data.days[i].lessons[ii],response.data.days[i].lessons[ii].dates ) {
					    date_value = response.data.days[i].lessons[ii].dates[0];
					}
					if ( response.data.days[i].lessons[ii].date_start ) {
					    date_value = response.data.days[i].lessons[ii].date_start;
					}
					
					var auditory_name = '';
					if ( response.data.days[i].lessons[ii].auditories.length > 0 && response.data.days[i].lessons[ii].auditories[0].auditory_name != 'Нет данных' ) {
					    auditory_name = response.data.days[i].lessons[ii].auditories[0].auditory_name;
					}
					
                                        var lessonData = {
                                            subject: response.data.days[i].lessons[ii].subject,
                                            type: response.data.days[i].lessons[ii].type,
                                            typeName: response.data.days[i].lessons[ii].typeName,
                                            date: date_value,
                                            time_start: response.data.days[i].lessons[ii].time_start,
                                            time_end: response.data.days[i].lessons[ii].time_end,
                                            auditory_name: auditory_name,
                                            auditory_address: response.data.days[i].lessons[ii].auditories.length > 0 ? response.data.days[i].lessons[ii].auditories[0].auditory_address : '',
					    auditories_json: response.data.days[i].lessons[ii].auditories.length > 0 ? JSON.stringify( response.data.days[i].lessons[ii].auditories[0] ) : '',
                                            teacher_id: response.data.days[i].lessons[ii].teachers.length > 0 ? response.data.days[i].lessons[ii].teachers[0].teacher_id : '',
                                            teacher_name: response.data.days[i].lessons[ii].teachers.length > 0 ? response.data.days[i].lessons[ii].teachers[0].teacher_name : '',
					    teachers_json: response.data.days[i].lessons[ii].teachers.length > 0 ? JSON.stringify( response.data.days[i].lessons[ii].teachers[0] ) : '',
                                            edit: false
                                        };
                                        
                                        lessons.push( lessonData );
                                        
                                    }
                                    
                                }
                            }
                            
                        }
                    }
                    
                    if ( lessons.length > 0 ) {
                        
                        app.cleanShedule();
                        
                        for ( var i in lessons ) {
                            if ( lessons.hasOwnProperty( i ) ) {
                                
                                app.lessons.create( lessons[i] );
                                
                            }
                        }
                        
                        app.onDataChange();
                        
		    }else if( group_data && parseInt( group_data.id ) != groupId ){
			
			app.cleanShedule();
			
		    }
		    
		}
		//Если группа другая, очищаем сохраненное в localStorage расписание
		else if( group_data && parseInt( group_data.id ) != groupId ){
		    
		    app.cleanShedule();
		    
		}
		
		app.loading(false);
		
	    })
	    .fail(function() {
		app.loading(false);
	    });
	    
	}
	else{
	    
	    //Если группа другая, очищаем сохраненное в localStorage расписание
	    if ( group_data && parseInt( group_data.id ) != groupId ) {
		
		setTimeout( app.cleanShedule, 500 );
		
	    }
	    
	}
        
    },
    
    //Инициализация формы с полями добавления/редактирования записи
    editorInit: function(){
        
        $('#error_message').empty();
        
        if( $('#lessonForm select[name="type"]').size() == 0 ){
            setTimeout( app.editorInit, 500 );
            return;
        }
        
        //Типы занятий
	for( var i in app.options.lesson_types ){
	    if ( app.options.lesson_types.hasOwnProperty( i ) ){
                $('#lessonForm select[name="type"]')
                .append( '<option value="' + app.options.lesson_types[i].id + '">' + app.options.lesson_types[i].name + '</option>' );
            }
	}
        
        app.select2Init( '#lessonForm select[name="type"]' );
        
        $('#lessonForm input.datepicker').datetimepicker( app.options.datepickerOpts );
	if( $( '.date-start,.date-end', '#lessonForm' ).size() > 0 ){
	    shedule.dateRangeInit( '#lessonForm .date-start', '#lessonForm .date-end', { weeks: true } );
	}
	
	//Список дат
	shedule.dateMultiInit( '#lessonForm input.datepicker-multi', { weeks: true } );
        
        var timepickerOpts = $.extend( {}, app.options.datepickerOpts, {
            datepicker: false,
	    timepicker: true,
            formatTime: 'H:i',
            format: 'H:i',
            step: 5,
	    minTime: '07:00',
	    maxTime: '21:59',
            onGenerate: function( current_time, input ){
                $('.xdsoft_datetimepicker .xdsoft_disabled').remove();
            },
            onSelectTime: function( current_time, input ){
                
                var next_input = input.nextAll('input:text');
                var input_val = input.val();
                
                if( next_input.size() > 0 && input_val != '__:__' && ( next_input.val() == '__:__' || ( app.timeToMinutes(input_val) > app.timeToMinutes(next_input.val()) ) ) ){
                    
                    var next_time = app.secondsToTime( ( app.timeToMinutes(input_val) * 60 + ( 60 * 60 * app.options.autoHours ) ), false );
                    if ( !app.validateTime( next_time ) ) {
                        next_time = '23:59';
                    }
                    next_input.datetimepicker( 'destroy' );
                    next_input.val( next_time );
                    next_input.datetimepicker( $.extend( {}, timepickerOpts, { defaultTime: input_val, minTime: input_val } ) );
                    
                }
                
            }
        });
        
        //time picker
	$('input[name="time_start"],input[name="time_end"]','#lessonForm').each( function(){
	    
	    $(this).datetimepicker( timepickerOpts );
	    
	})
	.bind( 'blur', function(){
	    $( '.xdsoft_datetimepicker' ).hide();
	});
        
        app.autoFocusInit( '#lessonForm input[name="time_start"]' );
        
        //Аудитории
	if ( $('#lessonForm input[name="auditory_id"]').is('.tags-select') ) {
	    
	    shedule.tagsSelectInit( '#lessonForm input[name="auditory_id"]', ['auditories', 'auditory'], ['аудиторию','аудиторию'], ['auditory_id', 'auditory_name', 'auditory_address'], shedule.auditory_callback );
	    
	} else {
	    
	    /*
	    for( var i in app.input_data.auditories ){
		if ( app.input_data.auditories.hasOwnProperty(i) ) {
		    
		    var tmp_opt = '<option data-adress="' + app.input_data.auditories[i].auditory_address + '" value="' + app.input_data.auditories[i].auditory_id + '">' + app.input_data.auditories[i].auditory_name + '</option>';
		    $('#lessonForm select[name="auditory_id"]').append( tmp_opt );
		    
		}
	    }
	    
	    app.select2Init( '#lessonForm select[name="auditory_id"]', function( value ){
		
		if( value == "add" ){
		    $('#lessonForm select[name="auditory_id"]').select2('val','');
		    $('#popup-add-place input:text').val('');
		    $('.modal-overlay').show();
		    $('#popup-add-place').show();
		}
		
	    });
	    */
	    
	    var callback_func = function(value){
		
		if( value === null ) return;
		
		if ( !parseInt(value.auditory_id) && !value.auditory_address ) {
		    
		    $('#lessonForm select[name="auditory_id"]').select2('val','');
		    $('#popup-add-place input:text').val( '' );
		    $('#popup-add-place #number-place').val( value.auditory_name );
		    $('.modal-overlay').show();
		    $('#popup-add-place').show();
		    
		}
		
	    }
	    
	    app.searchSelectInit( '#lessonForm input[name="auditory_id"]', 'auditories', 'auditory', ['аудиторию','аудиторию'], callback_func, 'auditory_id', 'auditory_name' );
	    
	}
        
        //Преподаватель
	if ( $('#lessonForm input[name="teacher_id"]').is('.tags-select') ) {
	    shedule.tagsSelectInit( '#lessonForm input[name="teacher_id"]', ['teachers', 'teacher'], ['преподавателя','преподавателя'], ['teacher_id', 'teacher_name'] );
	}else{
	    app.searchSelectInit( '#lessonForm input[name="teacher_id"]', 'teachers', 'teacher', ['преподавателя','преподавателя'], null, 'teacher_id', 'teacher_name' );
	}
	
	//Группа
	if ( $('#lessonForm input[name="group_id"]').size() > 0 ) {
	    shedule.tagsSelectInit( '#lessonForm input[name="group_id"]', ['groups', 'group'], ['группу','группы'], ['group_id', 'group_name'] );
	}
	
	//Обрезаем массив занятий, если их слишком много, иначе ошибка
	if ( app.input_data.lessons.length > 1500 ) {
	    app.input_data.lessons = app.input_data.lessons.slice( 0, 1500 );
	}
	
	//lesson subject
        $( '#lessonForm input[name="subject"]' ).autocomplete({
	    source: [ app.input_data.lessons ],
	    valid: function( value,query ){
		return query.toLowerCase() == value.substr(0,query.length).toLowerCase();
	    },
	    showHint: true,
	    dropdownStyle: { display: 'none' }
	});
	
    },
    
    //onLessonEdit
    onLessonEdit: function( lessonData ){
	
        //Добавляем препода в общий список, если его там ещё нет
        if ( !parseInt( lessonData.teacher_id ) && lessonData.teacher_name ) {
            
            var exists = false;
            for( var i in app.input_data.teachers ){
                if ( !app.input_data.teachers.hasOwnProperty( i ) ) continue;
                
                if ( app.input_data.teachers[i].teacher_name == lessonData.teacher_name ) {
                    exists = true;
                    break;
                }
            }
            
            if ( !exists ) {
                app.input_data.teachers.push( { teacher_id: 0, id: 0, teacher_name: lessonData.teacher_name } );
		app.sortingData('teachers');
            }
            
        }
        
        //Добавляем предмет в общий список, если его там ещё нет
        if ( $.inArray( lessonData.subject, app.input_data.lessons ) == -1 ) {
            app.input_data.lessons.push( lessonData.subject );
        }
        
    },
    
    //Добавление аудитории
    addPlaceInit: function(){
	
	$('#addPlace').bind( 'click', function(){
	    
	    var nPl = $('#number-place').val();
	    if ( !nPl ) {
		$('#number-place').css( 'border-color','#ff0000' );
		return false;
	    }else{
		$('#number-place').removeAttr('style');
	    }
	    
	    if($('#street-place').val() != ''){
		var adPl = $('#street-place').val();
		if($('#house-place').val() != ''){
		    adPl += ', д. ' + $('#house-place').val();
		}
		if($('#corpus-place').val() != ''){
		    adPl += ', корп. ' + $('#corpus-place').val();
		}
		if($('#build-place').val() != ''){
		    adPl += ', стр. ' + $('#build-place').val();
		}
		if($('#name-place').val() != ''){
		    adPl += ', ' + $('#name-place').val();
		}
	    } else {
		var adPl = null;
	    }
	    
	    if( nPl ){
                
                nPl = nPl.replace( /[\<\>"]/g, '' );
                if( adPl ) adPl = adPl.replace( /[\<\>"]/g, '' );
                
		app.addPlace( nPl, adPl );
		
            }
            
	    $('.modal,.modal-overlay').hide();
	    
	    return false;
	    
	});
    },
    
    addPlace: function( name, address ){
	
	var tmp = '<option data-adress="' + ( address ? address : '' ) + '" value="' + name + '">' + name + '</option>';
	$('#lessonForm select.class-lesson').append(tmp);
	$('#lessonForm select.class-lesson').select2( "val", name );
	
	var data = { auditory_id: 0, auditory_name: name, auditory_address: address };
	app.input_data.auditories.push( data );
	app.data.auditory = data;
	
	app.sortingData('auditories');
	
    },
    
    /**
     * Сортирует входные данные по алфавиту 
     *
     */
    sortingData: function( data_name ){
	
	if ( !app.input_data[ data_name ] ) { return; }
	
	switch ( data_name ){
	    case "auditories":
		var key = 'auditory_name';
	    break;
	    case "teachers":
		var key = 'teacher_name';
	    break;
	    default:
		var key = 'title';
	    break;
	}
	
	app.input_data[ data_name ] = app.input_data[ data_name ].sort(function(a, b) {
	    return a[key].toLowerCase() == b[key].toLowerCase() ? 0 : a[key].toLowerCase() < b[key].toLowerCase() ? -1 : 1;
	});
	
    },
    
    parseGetParams: function() {
	var $_GET = {};
	var __GET = window.location.search.substring(1).split("&");
	for(var i=0; i<__GET.length; i++) {
	   var getVar = __GET[i].split("=");
	   $_GET[getVar[0]] = typeof(getVar[1])=="undefined" ? "" : app.urldecode( getVar[1] );
	}
	return $_GET;
    },
    
    urldecode: function( url ){
	return decodeURIComponent(url.replace(/\+/g, ' '));
    },
    
    //Данные с сервера
    getData: function( item_id, data_key, callback ){
        
        if ( typeof callback == 'undefined' ) {
            var callback = function(){};
        }
        if ( !item_id || item_id == '0' ) {
            callback();
            return;
        }
	
	var request_url = '';
	var name_field = '';
	switch ( data_key ) {
	    case "teachers":
		request_url = app.options.apiUrl + 'universities/' + item_id + '/teachers';
		name_field = 'teacher_name';
	    break;
	    case "lessons":
		request_url = app.options.apiUrl + 'universities/' + item_id + '/lessons/subjects';
	    break;
	    case "groups":
		request_url = app.options.apiUrl + 'faculties/' + item_id + '/groups';
	    break;
	    case "auditories":
		request_url = app.options.apiUrl + 'universities/' + item_id + '/auditories';
		name_field = 'auditory_name';
	    break;
	}
	
	$.getJSON( request_url, function( response ){
	    
	    if ( response.data && name_field ) {
		
		//фильтруем пустые
		app.input_data[ data_key ] = [];
		for( var i in response.data ){
		    if ( response.data.hasOwnProperty(i) ) {
			
			if ( response.data[i][name_field] ) {
			    app.input_data[ data_key ].push( response.data[i] );
			}
			
		    }
		}
		
	    }else{
		app.input_data[ data_key ] = response.data;
	    }
	    
	    if ( typeof callback == 'function' ) {
		callback();
	    }
	});
	
    },
    
    //Селект с автодополнением
    searchSelectInit: function( el_selector, data_key, return_data_key, msg_arr, callback, field_id, field_name ){
        
        var opts = {
	    width: '280px',
            placeholder: 'Выберите ' + msg_arr[1],
	    allowClear: true,
            closeOnSelect: true,
	    formatResult: function(item) { return item[field_name]; },
	    formatSelection: function(item) { return item[field_name]; },
	    matcher: function( term, text, option ) {
		return option[field_name].toUpperCase().indexOf( term.toUpperCase() ) >= 0;
	    }
	};
        
        if( $( el_selector + ':first' ).data('width') ){
            opts.width = $( el_selector + ':first' ).data('width');
        }
        
	$( el_selector + ':first' ).select2( $.extend( {}, opts, {
		formatNoMatches: function( term ){
		    return 'добавить ' + msg_arr[0];
		},
		query: function (query) {
		    
		    var element = $(this)[0].element;
		    var data = { results: [] };
		    
		    $.each( app.input_data[ data_key ], function(){
			if( query.term.length == 0 || this[field_name].toUpperCase().indexOf(query.term.toUpperCase()) >= 0 ){
			    var tmp_obj = $.extend({},this,{ id: this[field_id] });
			    data.results.push( tmp_obj );
			}
		    });
		    
		    //значение нашлось в списке
		    if ( data.results.length > 0 ) {
			
			query.callback( data );
			
		    }
		    //если нужно добавить новое значение
		    else{
			
			var new_text = $('#select2-drop .select2-input').val();
			new_text = new_text.replace( /[\<\>"]/g, '' );
			var new_value = [ { } ];
			new_value[0].id = '0';
			new_value[0][field_id] = '0';
			new_value[0][field_name] = new_text;
			
			if( new_value[0][field_name] ){
			    
			    var tmp_name = '<a href="#" onclick="var sl2 = $(this).closest(\'#select2-drop\').data(\'select2\'); sl2.opts.element.select2( \'data\', { id: 0, ' + field_name + ': \''+new_value[0][field_name]+'\'} ).trigger(\'change\');">добавить '+ msg_arr[0] + '</a>';
			    var tmp_obj = {};
			    tmp_obj[ field_name ] = tmp_name;
			    results = [ { text: return_data_key, children: new_value }, tmp_obj ],
			    query.callback({ results: results });
			    
			}else{
			    query.callback( { results: [] } );
			}
			
		    }
		    
		}
		
	    })
	)
	.on("change", function(e) {
	    
	    var new_value = e.added || $(e.target).select2('data');
	    
	    $(e.target).select2('close');
	    
	    if( new_value ){
                
		if ( !new_value[ field_id ] ) {
		    new_value[ field_id ] = 0;
		}
		app.data[ return_data_key ] = new_value;
                
	    }else{
		app.data[ return_data_key ] = {};
	    }
	    
	    if ( typeof callback == 'function' ) {
		callback(new_value);
	    }
	    
	    $(this).prev('.select2-container').find('.select2-choice').removeAttr('style');
	    
	})
	.on("select2-open", function( e ) {
	    
	    var value = $(e.target).select2('data');
	    
	    if ( value && !parseInt(value.id) ) {
		$('.select2-drop:visible input.select2-input').val( value[ field_name ] );
	    }
	    
	})
        .on("select2-close", function( e ){
	    //$(e.target).trigger('change');
	});
        
        //Значение по умолчанию
        app.data[ return_data_key ] = {};
        var value_default = $( el_selector ).data('value') ? $( el_selector ).data('value') : null;
	
        if ( value_default && typeof value_default != 'object' && value_default.indexOf('{') === 0 ) {
            value_default = $.parseJSON( value_default.replace(/'/g,'"') );
            if( value_default.id ) value_default[field_id] = value_default.id;
        }
	
        if( typeof value_default == 'object' ){
            
            if( !$.isEmptyObject(value_default) ){
                app.data[ return_data_key ] = value_default;
                $( el_selector + ':first' ).select2( 'data', value_default );
            }
            
        }
        
    },
    
    //Кастомный селект
    select2Init: function( selector, callback ){
	
	$( selector ).select2({
	    formatNoMatches: function( term ){
		return 'Ничего не найдено.';
	    }
	})
	.on("change", function(e) {
	    if ( typeof callback == 'function' ) {
		callback( $(e.target).select2('val') );
	    }
	})
	.on("select2-open", function( e ) {
	    //$('.select2-drop:visible .select2-search').hide();
	});
        
        if ( $( selector ).data('value') ) {
            $( selector ).select2( 'val', $( selector ).data('value') );
        }
	
    },
    
    /**
     * Проверка даты
     *
     */
    validateDate: function( date_str ){
	
	var checked = /\d{2}\.\d{2}\.\d{4}/.test( date_str );
	
	if ( checked ) {
	    
	    var tmp_arr = date_str.split('.');
	    var year = parseInt(tmp_arr[2]);
	    var current_year = new Date().getFullYear();
	    
	    if( Math.abs( year - current_year ) > 1 ){
		checked = false;
	    }
	    
	}
	
	return checked;
	
    },
    
    validateTime: function ( time ) {
	
	var is_valid = /\d{2}\:\d{2}/.test( time );
	if ( is_valid ) {
	    is_valid = ( app.timeToMinutes(time) / 60 ) < 24;
	}
	return is_valid;
    },
    
    //Проверка заполнения полей дат с подсцветкой ошибок
    validateTimeFields: function( selector ){
        
	var errors = 0;
	
	if ( $( selector ).size() == 2 && $( selector ).eq(0).val() == $( selector ).eq(1).val() ) {
	    
	    $( selector ).css( 'border-color','#ff0000' );
	    errors = 2;
	    
	}else{
	    
	    $( selector ).each( function(){
		
		var time_value = $(this).val();
		is_valid = !time_value || app.validateTime( time_value );
		
		if ( time_value && is_valid ) {
		    
		    var index = $(this).is('[name="time_end"]') ? 1 : $(this).prevAll('input:text').size();
		    
		    //если это окончание пар, проверяем что время указано верно
		    if ( is_valid && index == 1 ) {
			var prev_time = $(this).closest('div,td').find('input[type="text"]:first').val();
			if( prev_time && app.timeToMinutes(time_value) < app.timeToMinutes(prev_time)){
			    errors++;
			    is_valid = false;
			}
		    }
		    
		}
		
		if ( !is_valid ) {
		    $(this).css( 'border-color','#ff0000' );
		    errors++;
		}else{
		    $(this).removeAttr('style');
		}
		
	    });
	
	}
	
	return errors;
	
    },
    
    //время переводит в секунды
    timeToMinutes: function( time ){
	
        var time_arr = time.split(':');
        var dur = 0;
        var t = [ 60, 1 ];//[ 3600, 60, 1 ];
        
        for( var i in time_arr ){
            dur += ( parseFloat( time_arr[i] ) * t[i] );
        }
        
        return dur;
        
    },
    
    //Секунды переводит в строку времени
    secondsToTime: function( in_seconds, out_seconds ){
        
        if ( typeof out_no_seconds == 'undefined' ) {
            var out_no_seconds = true;
        }
        
        var time = '';
        in_seconds = parseFloat( in_seconds.toFixed(2) );
        
        var hours   = Math.floor(in_seconds / 3600);
        var minutes = Math.floor((in_seconds - (hours * 3600)) / 60);
        var seconds = in_seconds - (hours * 3600) - (minutes * 60);
        seconds = Math.floor( seconds );
        //seconds = seconds.toFixed(2);
        
        if (hours   < 10) {hours   = "0"+hours;}
        if (minutes < 10) {minutes = "0"+minutes;}
        if (seconds < 10) {seconds = "0"+seconds;}
        var time = hours+':'+minutes + ( out_seconds ? ':'+seconds : '' );
        
        return time;
        
    },
    
    //Авто фокус в поле "время окончания занятия"
    autoFocusInit: function( selector ){
	
	$( selector )
	.bind( 'keyup', function(){
	    
	    if( $(this).is('[name="time_start"]') && app.getCaretPosition($(this).get(0)) == 5 ){
		var time_end = $(this).closest('div').find('[name="time_end"]');
		time_end.focus();
		app.setCaretPosition( time_end.get(0), 0 );
	    }
	    
	});
	
    },
    
    getCaretPosition: function(ctrl) {
	var CaretPos = 0;
	// IE Support
	if (document.selection) {
	    ctrl.focus ();
	    var Sel = document.selection.createRange();
	    Sel.moveStart ('character', -ctrl.value.length);
	    CaretPos = Sel.text.length;
	}
	// Firefox support
	else if (ctrl.selectionStart || ctrl.selectionStart == '0')
	    CaretPos = ctrl.selectionStart;
	return (CaretPos);
    },
    
    
    setCaretPosition: function(ctrl, pos)
    {
	if(ctrl.setSelectionRange){
	    ctrl.focus();
	    ctrl.setSelectionRange(pos,pos);
	}
	else if (ctrl.createTextRange) {
	    var range = ctrl.createTextRange();
	    range.collapse(true);
	    range.moveEnd('character', pos);
	    range.moveStart('character', pos);
	    range.select();
	}
    },
    
    //Проверка заполнения и формирвоание объекта со значениями формы
    getFormValues: function(){
        
        var error = app.validateTimeFields( '#lessonForm [name="time_start"],#lessonForm [name="time_end"]' );
	
	//Диапазон дат
	if ( $( '.date-start,.date-end', '#lessonForm' ).size() > 0 ) {
	    
	    var valid = shedule.validateDatesRange( '#lessonForm .date-start', '#lessonForm .date-end' );
	    if ( !valid ) { error++; }
	    
	}
	
	//список дат
	if ( $( '#lessonForm .datepicker-multi' ).size() > 0 ) {
	    
	    var dates_error = shedule.validateMultiDates( '#lessonForm .datepicker-multi', 'boolean' );
	    if( dates_error ){ error++; }
	    
	}
        
        var required = [ 'date', 'subject', 'type', 'time_start', 'time_end' ];
        
	var formData = $('#lessonForm').serializeArray();
        var lessonData = { sixdays: false };
	
        $.each( formData, function(index, obj) {
            
            //Проверка заполнения
            var valid = true;
            
            if ( $.inArray( obj.name, required ) > -1 ) {
                if ( !obj.value ) {
                    valid = false;
                }
                else if ( obj.name.indexOf('date') > -1 && !app.validateDate(obj.value) ) {
                    valid = false;
                }
                else if ( obj.name.indexOf('time_') > -1 && !app.validateTime(obj.value) ) {
                    valid = false;
                }
            }
            
            if ( !valid ) {
                error++;
                if ( $('#lessonForm [name="'+obj.name+'"]').is('input') ) {
                    $('#lessonForm [name="'+obj.name+'"]').addClass('error');
                }
                else if( $('#lessonForm [name="'+obj.name+'"]').is('.select2-offscreen') ){
                    $('#lessonForm [name="'+obj.name+'"]').prev('.select2-container').find('.select2-choice').css('border-color','#ff0000');
                }
            }else{
                
                if ( $('#lessonForm [name="'+obj.name+'"]').is('input') ) {
                    $('#lessonForm [name="'+obj.name+'"]').removeClass('error');
                }
                else if( $('#lessonForm [name="'+obj.name+'"]').is('.select2-offscreen') ){
                    $('#lessonForm [name="'+obj.name+'"]').prev('.select2-container').find('.select2-choice').removeAttr('style');
                }
		
		//Сохраняем значения
		switch ( obj.name ) {
		    
		    case "date_start":
		    case "date_end":
			
			lessonData[obj.name] = obj.value && app.validateDate( obj.value ) ? obj.value : null;
			
		    break;
		    
		    case "auditory_id":
			
			if( $('#lessonForm [name="'+obj.name+'"]').is('.tags-select') ){
			    
			    if ( obj.value ) {
				
				var value = obj.value.split('|');
				lessonData.auditory_name = value.join(', ');
				lessonData.auditories_json = JSON.stringify( shedule.data['auditory'] );
				
			    }else{
				
				lessonData.auditory_name = '';
				lessonData.auditories_json = '[]';
				
			    }
			    
			    lessonData[obj.name] = '';
			    
			}else{
			    
			    lessonData[obj.name] = app.data.auditory.auditory_id ? app.data.auditory.auditory_id : 0;
			    lessonData.auditory_name = app.data.auditory.auditory_name ? app.data.auditory.auditory_name : '';
			    lessonData.auditory_address = app.data.auditory.auditory_address ? app.data.auditory.auditory_address : '';
			    lessonData.auditories_json = JSON.stringify( app.data.auditory );
			    
			}
			
		    break;
		    case "teacher_id":
			
			if( $('#lessonForm [name="'+obj.name+'"]').is('.tags-select') ){
			    
			    if ( obj.value ) {
				
				var value = obj.value.split('|');
				lessonData.teacher_name = value.join(', ');
				lessonData.teachers_json = JSON.stringify( shedule.data.teacher );
				
			    }else{
				
				lessonData.teacher_name = '';
				lessonData.teachers_json = '[]';
				
			    }
			    
			    lessonData[obj.name] = '';
			    
			}else{
			    
			    lessonData[obj.name] = app.data.teacher && app.data.teacher.teacher_id ? app.data.teacher.teacher_id : 0;
			    lessonData.teacher_name = app.data.teacher && app.data.teacher.teacher_name ? app.data.teacher.teacher_name : '';
			    lessonData.teachers_json = JSON.stringify( app.data.teacher );
			    
			}
			
		    break;
		    case "group_id":
			
			if ( obj.value ) {
			    
			    var value = obj.value.split('|');
			    lessonData.group_id = value.join(', ');
			    lessonData.group_json = JSON.stringify( shedule.data.group );
			    
			}else{
			    lessonData.group_id = '';
			    lessonData.group_json = '[]';
			}
			
		    break;
		    case "type":
			
			lessonData.typeName = app.options.lesson_types['type'+obj.value] ? app.options.lesson_types['type'+obj.value].name : shedule.getLessonTypeName(obj.value);
			lessonData[obj.name] = obj.value;
			
		    break;
		    default:
			lessonData[obj.name] = obj.value;
		    break;
		}
		
            }
        });
	
	//console.log('getFormValues',lessonData);
	
        return error > 0 ? null : lessonData;
        
    },
    
    onDataChange: function(){
        
        $('#error_message').empty();
        
	if ( app.lessons.length == 0 ) {
	    $('#btn-new-shedule').hide();
	}else{
	    $('#btn-new-shedule').show();
	}
	
    },
    
    //getLessonData
    getLessonData: function( attributes ){
	
	var output = {
	    time_start: attributes.time_start,
	    time_end: attributes.time_end,
	    subject: attributes.subject,
	    type: attributes.type,
	    dates: [],
	    parity: 0
	};
	
	output.dates = attributes.date ? [ attributes.date ] : [];
	
	if ( attributes.teacher_name ) {
	    output.teachers = [
		{
		    teacher_id: attributes.teacher_id,
		    teacher_name: attributes.teacher_name
		}
	    ];
	}else{
	    output.teachers = null;
	}
	
	if ( attributes.auditory_name ) {
	    output.auditories = [
		{
		    auditory_id: attributes.auditory_id,
		    auditory_name: attributes.auditory_name,
		    auditory_address: attributes.auditory_address
		}
	    ];
	}else{
	    output.auditories = null;
	}
	
	return output;
	
    },
    
    //Отправка данных
    sheduleSend: function(e){
        
        e.preventDefault();
        
        var email = $('#popup-confirm-email input[name="email"]').val();
        
        $('#popup-confirm-email .sendform-error').text('');
        
        if ( !email || email.indexOf('@') == -1 ) {
            
            $('#popup-confirm-email input[name="email"]')
            .css('border-color','#ff0000');
            
            return;
            
        }else{
            $('#popup-confirm-email input[name="email"]').removeAttr('style');
        }
        
        //check reCaptcha
        var recaptcha_response = grecaptcha.getResponse();
        if ( !recaptcha_response ) {
            $('#popup-confirm-email .sendform-error').text('Пожалуйста, подтвердите, что Вы не робот.');
            return;
        }
        
        var models = app.lessons.toArray();
        
        if ( models.length == 0 ) {
            $('#popup-confirm-email .sendform-error').text('Пожалуйста, заполните расписание.');
            return;
        }
        
        //console.log( 'sheduleSend', models );
        
        var get_data = app.parseGetParams();
        var group_data = {};
        group_data.id = get_data.idGroup ? get_data.idGroup : 0;
        group_data.title = get_data.nameGroup ? get_data.nameGroup : '';
        
        var outputData = {
            captchaResponse: recaptcha_response,
            cityId: get_data.city,
            cityName: get_data.nameCity,
            email: email,
            facultyName: get_data.fac,
            groupName: group_data.title,
            idFaculty: get_data.idFac,
            universityName: get_data.nameUniver,
            idUniversity: ( isNaN(get_data.univer) || !parseInt(get_data.univer) ? null : get_data.univer ),
            session: "true",
            mergedLessonTypes: "",
            mergeSchedule: "false",
            json: ''
        };
        
        var lessons_data = {
            faculties: [
                {
                    faculty_name: get_data.fac,
                    date_start: null,
                    date_end: null,
                    groups: [
                        {
                            group_name: group_data.title,
                            days: [
                                /*{
                                    weekday: null,
                                    lessons: []
                                }*/
                            ]
                        }
                    ]
                }
            ]
        };
	
        for( var i in models ){
            
            if ( models.hasOwnProperty(i) ) {
                
                var attributes = models[i].attributes;
		var tmp_data = app.getLessonData( attributes );
                var weekday = app.weekDay( attributes.date );
		
		var d_index = -1;
		for( var ii in lessons_data.faculties[0].groups[0].days ){
		    if ( lessons_data.faculties[0].groups[0].days.hasOwnProperty(ii) ) {
			if ( lessons_data.faculties[0].groups[0].days[ii].weekday == weekday ) {
			    d_index = parseInt( ii );
			    break;
			}
		    }
		}
		
                if ( d_index > -1 ) {
                    lessons_data.faculties[0].groups[0].days[d_index].lessons.push( tmp_data );
                }else{
                    lessons_data.faculties[0].groups[0].days.push( { weekday: weekday, lessons: [ tmp_data ] } );
                }
                
            }
            
        }
	
	//console.log( 'sheduleSend', lessons_data );
	//return;
	
        outputData.json = JSON.stringify( lessons_data );
        
        $('#popup-confirm-email input[name="email"]').attr( 'disabled', 'disabled' );
        
        $('#sheduleSend')
        .after('<img src="/webform/image/loader.gif" />')
        .hide();
        
        outputData = JSON.stringify( outputData );
        
	var step3_url = 'step3.html';
	if ( parseInt( get_data.idFac ) == 0 ) {//Новый факультет
	    step3_url += '#newfac';
	}else if ( parseInt( get_data.idGroup ) == 0 ) {//Новая группа
	    step3_url += '#new';
	}
	
        $.ajax({
            url: app.options.apiUrl + 'schedule/new',
            type: "POST",
            contentType: 'application/json',
            dataType: 'json',
            //async: true,
            data: outputData,
            cache: false,
            success: function(response) {
                
                window.location = step3_url;
                
            },
            error: function() {
                //$("#sendform-error").text("Произошла ошибка, сервер не может обработать Ваш запрос. Напишите нам об этом.").fadeIn(200).delay(2000).fadeOut(1000);
            }
        });
        
        setTimeout( function() { window.location.href = step3_url; }, 3000 );
        
        /*
        "faculties": [
            {
                "faculty_name": "Исторический факультет",
                "date_start": "01.09.2014",
                "date_end": "31.12.2014",
                "groups": [
                    {
                        "group_name": "111",
                        "days": [
                            {
                                "weekday": 1,
                                "lessons": [
                                    {
                                        "time_start": "09:00",
                                        "time_end": "10:30",
                                        "subject": "1111",
                                        "type": 2,
                                        "teachers": [
                                            {}
                                        ],
                                        "auditories": [
                                            {
                                                "auditory_name": ""
                                            }
                                        ],
                                        "parity": 0
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
        */
        
        //app.lessons.localStorage.findAll()
        
    },
    
    strtotime: function( date_str ){
        
        if ( !date_str ) { return 0; }
        
	if ( date_str.indexOf(',') ) {
	    var tmp_arr = date_str.split(',');
	    date_str = $.trim(tmp_arr[0]);
	}
	
        var tmp = date_str.split('.');
        tmp.reverse();
        
        return Date.parse( tmp.join('-') ) / 1000;
        
    },
    
    weekDay: function( date_str ){
        
        if ( !date_str ) { return 0; }
        
        var tmp = date_str.split('.');
        tmp.reverse();
        
        var myDate = new Date( tmp.join('-') );
        
        return myDate.getDay() ? myDate.getDay() : 7;
        
    }
    
};

/**************************************************************
 * Backbone application
 **************************************************************
 */

$(function () {

'use strict';

/**
 * Lesson model
 *
 */
app.Lesson = Backbone.Model.extend({
    
    defaults: {
        subject: '',
        type: '',
        typeName: '',
        date: '',
	date_start: '',
	date_end: '',
        time_start: '',
        time_end: '',
	auditory_id: '',
        auditory_name: '',
        auditory_address: '',
	auditories_json: '',
	group_id: '',
	group_json: '',
        teacher_id: '',
        teacher_name: '',
	teachers_json: '',
	sixdays: false,
        edit: false
    },
    /*
    toggle: function () {
        this.save({
            completed: !this.get('completed')
        });
    }
    */
});

/**
 * Lesson collection
 *
 */
app.LessonsCollection = Backbone.Collection.extend({
    
    model: app.Lesson,
    
    localStorage: new Backbone.LocalStorage( app.options.lessons_localStorage_name ),
    
    edited: function () {
        return this.where( { edit: true } );
    },
    
    closeEdited: function(){
        
        //закрываем другие редакторы, если есть
        var edited_lessons = this.edited();
        
        if ( edited_lessons.length > 0 ) {
            for( var i in edited_lessons ){
                if (edited_lessons.hasOwnProperty(i)) {
                    edited_lessons[i].save({edit:false});
                }
            };
        }
        
        $('#button-add-lesson').show();
        $('#add-lesson-container').empty();
        
    },
    
    nextOrder: function () {
        return this.length ? this.last().get('order') + 1 : 1;
    },
    
    comparator: function( lesson1, lesson2 ){
        if( !lesson1 || !lesson2) return 1;
        var time1 = app.strtotime(lesson1.get("date"));
        time1 += app.timeToMinutes(lesson1.get('time_start'));
        var time2 = app.strtotime(lesson2.get("date"));
        time2 += app.timeToMinutes(lesson2.get('time_start'));
        if ( time1 === time2 ) return 0;
        return time1 < time2 ? -1 : 1;
    }
    
});

app.lessons = new app.LessonsCollection();

/**
 * Lesson view
 *
 */
app.LessonView = Backbone.View.extend({
    
    tagName: 'tr',
    
    template: _.template($('#item-template').html()),
    editorTemplate: _.template($('#add-box-template').html()),
    
    events: {
        'click .remove': 'clear',
        'click .edit': 'edit',
        'click .cancel': 'cancel',
        'click .save': 'updateLesson'
    },
    
    initialize: function () {
        this.listenTo(this.model, 'change', this.render);
        this.listenTo(this.model, 'destroy', this.remove);
    },
    
    render: function () {
        
        if (this.model.changed.id !== undefined) {
            return false;
        }
        
        if ( this.model.get('edit') ) {
            this.$el.html( '<td colspan="4"><div class="add-lesson-session">' + this.editorTemplate(this.model.toJSON()) + '</div></td>' );
        }else{
            this.$el.html(this.template(this.model.toJSON()));
        }
        
        return this;
    },
    
    edit: function (e) {
        
        e.preventDefault();
        
        app.lessons.closeEdited();
        
        this.model.save({ edit: true });
        
        //app.lessons.sort();
        
        app.editorInit();
        
    },
    
    clear: function (e) {
        
        e.preventDefault();
        
        this.model.destroy();
        app.onDataChange();
        
    },
    
    updateLesson: function (e) {
	
        e.preventDefault();
        
        var lessonData = app.getFormValues();
        
        if ( !lessonData ) { return; }
	
	/*
        lessonData.teacher_name = '';
        if ( lessonData.teacher_id != '' && app.data.teacher.teacher_name ) {
            lessonData.teacher_name = app.data.teacher.teacher_name;
        }
	*/
	
        lessonData.edit = false;
        app.onLessonEdit( lessonData );
        
        this.model.save( lessonData );
        
    },
    
    cancel: function (e) {
        
        e.preventDefault();
        
        this.model.save({ edit: false });
        //this.model.trigger('change');
	
    }
    
    
});


/**
 * AppView
 *
 */
app.AppView = Backbone.View.extend({
    
    el: '#lessonsapp',
    editorTemplate: _.template($('#add-box-template').html()),
    
    events: {
        'click #button-add-lesson': 'addLessonInit',
        'click #add-lesson-container .cancel': 'cancelAddLesson',
        'click #add-lesson-container .save': 'saveLesson',
        'click #button-send-data': 'sendDataInit'
    },
    
    initialize: function () {
        
        this.$list = $('#lessons-list');
        
        //this.listenTo(app.lessons, 'add', this.addOne);
        this.listenTo(app.lessons, 'sync', this.restoreAll);
        this.listenTo(app.lessons, 'reset', this.addAll);
        this.listenTo(app.lessons, 'all', this.render);
        
        app.lessons.fetch({reset: true});
        
        if( app.lessons.edited().length > 0 ){
            app.editorInit();
        }
        
    },
    
    render: function () {
        
        if ( app.lessons.length ) {
            this.$list.show();
        }else{
            this.$list.hide();
        }
        
    },
    
    addOne: function (lesson) {
        var view = new app.LessonView({ model: lesson });
        this.$list.append(view.render().el);
    },
    
    addAll: function () {
        app.lessons.each(this.addOne, this);
    },
    
    restoreAll: function () {
        app.lessons.sort();
        this.$list.empty();
        app.lessons.each(this.addOne, this);
        app.onDataChange();
    },
    
    addLessonInit: function(e){
        
        e.preventDefault();
        
        //var form_output = $('#add-box-template').html();
        
        app.lessons.closeEdited();
        
        $('#button-add-lesson').hide();
        
        $('#add-lesson-container')
        .empty()
        .append( this.editorTemplate( (new app.Lesson).defaults ) );
        
        app.editorInit();
        
    },
    
    cancelAddLesson: function(e){
        
        e.preventDefault();
        
        $('#button-add-lesson').show();
        $('#add-lesson-container').empty();
        
    },
    
    //Сохранение нового занятия
    saveLesson: function(e){
	
        e.preventDefault();
        
        var lessonData = app.getFormValues();
	
        if ( !lessonData ) { return; }
	
        /*
        lessonData.type_name = shedule.getLessonTypeName(lessonData.type); //app.options.lesson_types[ 'type' + lessonData.type ].name;
        if( $('option:selected','#lessonForm select[name="auditory_name"]').size() > 0 ){
            lessonData.auditory_address = $('option:selected','#lessonForm select[name="auditory_name"]').data('adress');
        }
        
        if ( lessonData.teacher_id != '' && app.data.teacher.teacher_name ) {
            lessonData.teacher_name = app.data.teacher.teacher_name;
        }
	*/
	
        app.onLessonEdit( lessonData );
        
        app.lessons.create( lessonData );
        
        $('#button-add-lesson').show();
        $('#add-lesson-container').empty();
        
    },
    
    //Переход к отправке данных
    sendDataInit: function(e){
        
        e.preventDefault();
        
        var isValidForm = true;
        var getData = app.parseGetParams();
        var group_data = { id: getData.idGroup, title: getData.nameGroup };
	
        $('#error_message').empty();
        if( app.lessons.length == 0 ){
            $('#error_message').text('Пожалуйста, заполните расписание.');
            return;
        }
        
        if ( !isValidForm ) { return; }
        
        app.groupLocalStorage._clear();
        app.groupLocalStorage.create( group_data );
        
        $('#popup-confirm-email .sendform-error').text('');
        $('#popup-confirm-email').show();
        $('.modal-overlay').show();
        
    }
    
});

app.view = new app.AppView();

});
