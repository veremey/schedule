
/**
 * shedule
 *
 * @version 1.6
 */

var shedule = {
    
    audTitle: [],
    audAdress: [],
    options: {
        
	apiUrl: '/api/v1/',
	getLessonsBy: 'idGroup',
	imagesBaseUrl: '/webform/',
	interval_lesson: 15,
	minutes_length_lesson: 90,
	defaultTimeStart: '09:00',
	defaultTimeEnd: '10:30',
	loaded: false,
	times: [],
	
	select2Opts: {
	    //minimumInputLength: 3,
	    allowClear: true,
	    formatResult: function(item) { return item.title; },
	    formatSelection: function(item) { return item.title; },
	    matcher: function(term, text, option) {
		return option.title.toUpperCase().indexOf( term.toUpperCase() ) >= 0;
	    }
	},
	datetimepickerOpts: {
	    lazyInit: false,
	    datepicker: true,
	    timepicker: true,
	    formatDate: 'd.m.Y',
	    formatTime: 'H:i',
	    dayOfWeekStart: 1,
	    allowBlank: true,
	    scrollInput: false,
	    scrollMonth: false,
	    validateOnBlur: false,
	    closeOnDateSelect: true,
	    yearStart: new Date().getFullYear() - 1,
	    yearEnd: new Date().getFullYear() + 1,
	    lang: 'ru',
	    mask: true,
	    format: 'H:i',
	    step: 5,
	    //defaultTime: '07:00',
	    minTime: '07:00',
	    maxTime: '21:59'
	},
	
        lesson_overlay_html: '<div class="lesson-overlay" id="lesson-overlay"> \
	    <div class="lesson-overlay-b"> \
		<a class="popup-btn add" href="#" title="Добавить пару"></a> \
		<div class="popup-add-lesson"> \
		    <a class="add" href="#">Добавить пару</a> \
		</div> \
		<a class="popup-btn remove" href="#" title="Удалить занятие"></a> \
	    </div> \
        </div>'
        
    },
    
    //данные которые приходят с сервера
    input_data: {
	university: {},
	faculties: [],
	teachers: [],
	lessons: [],
	groups: [],
	auditories: [],
	lessontypes: []
    },
    
    //хранилище временных данных
    data: {
	lessons_days: [],
	lessons_cycle: [],
        faculties: [],
	teacher: [],
	group: [],
	auditory: []
    },
    
    /**
     * init
     * 
     */
    init: function(){
	
	var get_data = shedule.parseGetParams();
	if( ( typeof get_data.idFac == 'undefined' ) || ( typeof get_data.univer == 'undefined' ) || ( typeof get_data.fac == 'undefined' ) || ( typeof get_data.nameGroup == 'undefined' ) ){
	    document.location.href = 'step1.html';
	}
	
	this.getData( get_data.univer, 'teachers' );
	this.getData( get_data.univer, 'lessons' );
	this.getData( get_data.univer, 'auditories' );
	this.getData( null, 'lessontypes', function(){
	    for( var i in shedule.input_data.lessontypes ){
		if ( !shedule.input_data.lessontypes.hasOwnProperty( i ) ) continue;
		$('#addLessonForm select.lesson-type')
		.append( '<option value="' + shedule.input_data.lessontypes[i].type + '">' + shedule.input_data.lessontypes[i].typeName + '</option>' );
	    }
	});
	
	if ( get_data.nameGroup ) {
	    $('#sheduleTable .table-name-group').text( get_data.nameGroup );
	}
	
	//Изменение дня недели
	$(document).on( 'click', '#sheduleTable .change-day a', shedule.changeDayInit );
	
	//Новое расписание
	shedule.cleanSheduleInit();
	
	this.addPlaceInit();
	
	this.dateRangeInit( '#dates .date-start', '#dates .date-end' );
	
	/*
	$(document).on( 'click','input[type="radio"][name="notregular_radio"]',function(){
	    var radio = $(this).parent().parent().parent();
	    radio.parent().find('input[type=radio]').attr('checked', false);
	    radio.parent().find('input[type=text],select').prop( "disabled", true );
	    radio.find('input[type=text],select').prop( "disabled", false );
	    radio.parent().css('color', '#bababa');;
	    $(this).prop('checked', true);
	});
	*/
	
	shedule.overlayOnOverInit();
	
	//Отправление расписания
	$('.sendJSON').bind( 'click', shedule.showDataWindow );
	
	//Модальные окна
	$('.modal-overlay,.modal .btn-cancel').bind( 'click', function(e){
		$('.modal-overlay').hide();
		$('.modal').hide();
		return false;
	    }
	);
	
	$('#wrapper-form input[name="shedule_type"]')
	.bind( 'click', function(){
	    var query_str = document.location.href.substr(document.location.href.indexOf('?'));
	    if( $(this).val() == '1' ){
                document.location.href = '/webform/step2.html' + query_str;
	    }else if ( $(this).val() == '2' ) {
		document.location.href = '/webform/step2_med.html' + query_str;
	    }else if ( $(this).val() == '3' ) {
		document.location.href = '/webform/step2_ses.html' + query_str;
	    }
	});
	
	shedule.sendFormInit();
	shedule.bellsFormInit();
	//shedule.searchSelectInit( '#group_name', 'groups', 'group', ['группу','группу'], null, 'id', 'title' );
	shedule.getSavedLessons();
	
    },
    
    loading: function( active ){
	
	if ( $('#loading').size() == 0 ) {
	    $(document.body).append('<div id="loading">Пожалуйста, подождите...</div>');
	}
	
	setTimeout( function(){
	    $('#loading').css( 'display', ( active ? 'block' : 'none' ) );
	}, ( active ? 0 : 500 ) );
	
    },
    
    /**
     * Данные с сервера
     *
     */
    getData: function( item_id, data_key, callback ){
	
	var request_url = '';
	var name_field = '';
	switch ( data_key ) {
	    case "teachers":
		if ( !item_id || item_id == '0' ) return;
		request_url = shedule.options.apiUrl + 'universities/' + item_id + '/teachers/';
		name_field = 'teacher_name';
	    break;
	    case "lessons":
		if ( !item_id || item_id == '0' ) return;
		request_url = shedule.options.apiUrl + 'universities/' + item_id + '/lessons/subjects/';
	    break;
	    case "groups":
		if ( !item_id || item_id == '0' ) return;
		request_url = shedule.options.apiUrl + 'faculties/' + item_id + '/groups/';
	    break;
	    case "auditories":
		if ( !item_id || item_id == '0' ) return;
		request_url = shedule.options.apiUrl + 'universities/' + item_id + '/auditories/';
		name_field = 'auditory_name';
	    break;
	    case "lessontypes":
		request_url = shedule.options.apiUrl + 'admin/lessontypes';
		name_field = 'typeName';
	    break;
	    case "groups":
		request_url = shedule.options.apiUrl + 'universities/' + item_id + '/groups';
		name_field = 'title';
	    break;
	    case "faculty_groups":
		request_url = shedule.options.apiUrl + 'faculties/' + item_id + '/groups';
		name_field = 'title';
		data_key = 'groups';
	    break;
	    case "university":
		request_url = shedule.options.apiUrl + 'universities/' + item_id;
		name_field = 'title';
	    break;
	    case "faculties":
		request_url = shedule.options.apiUrl + 'universities/' + item_id + '/faculties/full';
		name_field = 'title';
	    break;
	}
	
	$.getJSON( request_url, function( response ){
	    
	    if ( response.data && name_field ) {
		
		if ( $.isArray( response.data ) ) {
		    
		    //фильтруем пустые
		    shedule.input_data[ data_key ] = [];
		    for( var i in response.data ){
			if ( response.data.hasOwnProperty(i) ) {
			    
			    if ( response.data[i][name_field] && response.data[i][name_field] != 'Нет данных' ) {
				shedule.input_data[ data_key ].push( response.data[i] );
			    }
			    
			}
		    }
		    
		}
		else{
		    
		    shedule.input_data[ data_key ] = response.data;
		    
		}
		
	    }else{
		shedule.input_data[ data_key ] = response.data;
	    }
	    
	    if ( typeof callback == 'function' ) {
		callback( response );
	    }
	    
	});
	
    },
    
    
    getWeekIndex: function( weekday ){
	
	var d_index = -1;
	for( var i in shedule.data.lessons_days ){
	    if ( shedule.data.lessons_days.hasOwnProperty(i) ) {
		if ( shedule.data.lessons_days[i].weekday == weekday ) {
		    d_index = parseInt( i );
		    break;
		}
	    }
	}
	
	return d_index;
	
    },
    
    
    /**
     * Запрос ранее сохраненного расписания для его редактирования
     *
     */
    getSavedLessons: function( get_dates ){
	
	if ( typeof get_dates == 'undefined' ) { var get_dates = true; }
	var get_data = shedule.parseGetParams();
	var paramId = !isNaN(get_data[shedule.options.getLessonsBy]) && parseInt(get_data[shedule.options.getLessonsBy]) ? get_data[shedule.options.getLessonsBy] : 0;
	
	if ( parseInt( paramId ) ) {
	    
	    this.loading(true);
	    
	    var api_url = '';
	    if( shedule.options.getLessonsBy == 'idGroup' ) {
		api_url = shedule.options.apiUrl + 'groups/' + paramId;
	    }
	    else if ( shedule.options.getLessonsBy == 'idTeacher' ) {
		api_url = shedule.options.apiUrl + 'teachers/' + paramId;
	    }
	    
	    $.getJSON( api_url, function( response ){
		
		if( response.success && response.data.days && response.data.days.length > 0 ){
		    
		    shedule.data.lessons_days = response.data.days;
		    
		    //Цикловые занятия
		    if ( typeof app != 'undefined' && app.options.shedule_type_name == 'cycle' ) {
			shedule.getCycleLessons();
		    }
		    
		    shedule.updateTable();
		    shedule.onDataChange();
		    
		    //Берем даты
		    if ( get_dates ) {
			
			if ( response.data.schedule_end_date ) {
			    $('#dates .date-end').val( shedule.unixtimeToDate( response.data.schedule_end_date ) );
			}
			if ( response.data.parity_countdown ) {
			    $('#dates .date-start').val( shedule.unixtimeToDate( response.data.parity_countdown ) );
			}
			
			//Если даты есть, убираем блокировки чтобы можно было удобно менять даты
			if ( response.data.schedule_end_date && response.data.parity_countdown ) {
			    
			    $('#dates .date-start')
			    .data('xdsoft_datetimepicker')
			    .setOptions( { onShow: function(){}, maxDate: false } );
			    
			    $('#dates .date-end')
			    .data('xdsoft_datetimepicker')
			    .setOptions( { onShow: function(){}, minDate: false } );
			    
			}
			
		    }
		    
		}
		
		if ( typeof onGetDataComplete == 'function' ) {
		    onGetDataComplete();
		}
		
		shedule.loading(false);
		shedule.options.loaded = true;
		
	    })
	    .fail(function() {
		app.loading(false);
	    });
	    
	}
	//Если это новая группа или преподаватель, то берем начало и конец семестра по факультету
	else{
	    
	    if ( get_data['idFac'] ) {
		
		shedule.updateDatesByFaculty( get_data['idFac'] );
		
	    }
	    
	    if ( typeof onGetDataComplete == 'function' ) {
		onGetDataComplete();
	    }
	    shedule.options.loaded = true;
	}
	
    },
    
    
    /**
     * Заполнение дат начала и окончания семестра по факультету
     *
     */
    updateDatesByFaculty: function( fac_id ){
	
	if ( fac_id ) {
	    
	    $.getJSON( shedule.options.apiUrl + 'faculties/' + fac_id, function( response ){
		
		if ( response.data ) {
		    
		    if ( response.data.startDate ) {
			$('#dates .date-start').val( shedule.unixtimeToDate( response.data.startDate ) );
		    }
		    if ( response.data.endDate ) {
			$('#dates .date-end').val( shedule.unixtimeToDate( response.data.endDate ) );
		    }
		    
		}
		
	    });
	    
	}
	
    },
    
    
    /**
     * Функция отбирает цикловые занятия и пишет их в отдельныз массив
     *
     */
    getCycleLessons: function(){
	
	var l_map = [[],[],[],[]];//0 - названия, 1 - сколько на неделе, 2 - индекс дня недели, 3 - индекс занятия
	
	for ( var i in shedule.data.lessons_days ) {
	    if ( shedule.data.lessons_days.hasOwnProperty(i) ) {
		
		for ( var ii in shedule.data.lessons_days[i].lessons ) {
		    if ( shedule.data.lessons_days[i].lessons.hasOwnProperty(ii) ) {
			
			var lesson = shedule.data.lessons_days[i].lessons[ii];
			
			if( lesson.date_start && lesson.date_end ){
			    
			    var l_name = lesson.subject + '-' + lesson.date_start + '-' + lesson.date_end + '-' + lesson.time_start + '-' + lesson.time_end;
			    
			    if ( $.inArray( l_name, l_map[0] ) == -1 ) {
				
				l_map[0].push(l_name);
				l_map[1].push(1);
				l_map[2].push([parseInt(i)]);
				l_map[3].push([parseInt(ii)]);
				
			    }else{
				
				var index = $.inArray( l_name, l_map[0] );
				l_map[1][index]++;
				l_map[2][index].push(parseInt(i));
				l_map[3][index].push(parseInt(ii));
				
			    }
			    
			}
			
		    }
		}
		
		
	    }
	}
	
	//Если есть цикловые
	if ( l_map[1].length > 0 ) {
	    
	    var max_count = shedule.arrayMax(l_map[1]);
	    
	    if ( max_count >= 5 ) {
		
		var names = [];
		
		for( var i = 0; i < l_map[0].length; i++ ){
		    
		    var count_days = l_map[1][i];
		    
		    if ( count_days >= 5 ) {
			
			var day_indexes = l_map[2][i];
			var lesson_indexes = l_map[3][i];
			
			for( var ii = 0; ii < day_indexes.length; ii++ ){
			    
			    var l_ind = lesson_indexes[ii];
			    var lesson = shedule.data.lessons_days[day_indexes[ii]].lessons[l_ind];
			    if ( count_days >= 6 ) {
				lesson.sixdays = true;
			    }
			    
			    //Добавляем в массив цикловых
			    if ( $.inArray( l_map[0][i], names ) == -1 ) {
				
				shedule.data.lessons_cycle.push( lesson );
				names.push( l_map[0][i] );
				
			    }
			    
			    //Делаем отметку
			    lesson.is_cycle = true;
			    
			}
			
		    }
		    
		}
		
	    }
	    
	    
	}
	
	//Удаляем цикловые из основного расписания
	shedule.deleteCycleLessons();
	
    },
    
    arrayMax: function(arr) {
	return arr.reduce(function (p, v) {
	    return ( p > v ? p : v );
	});
    },
    
    
    /**
     * Удаляет цикловые из основного расписания
     *
     */
    deleteCycleLessons: function(){
	
	for( var i = 0; i < shedule.data.lessons_days.length; i++ ){
	    for( var ii = 0; ii < shedule.data.lessons_days[i].lessons.length; ii++ ){
		
		var lesson = shedule.data.lessons_days[i].lessons[ii];
		
		if( lesson.is_cycle ){
		    
		    shedule.data.lessons_days[i].lessons.splice( ii, 1 );
		    
		    shedule.deleteCycleLessons();
		    break;
		    
		}
		
	    }
	}
	
	return true;
    },
    
    
    /**
     * unixtimeToDate
     *
     */
    unixtimeToDate: function( unixtime ){
	
	var date = new Date( parseInt( unixtime ) * 1000 );
	var day = date.getDate();
	if ( day < 10 ) { day = '0' + day; }
	var month = date.getMonth() + 1;
	if ( month < 10 ) { month = '0' + month; }
	
	return day + '.' + month + '.' + date.getFullYear();
	
    },
    
    
    /**
     * timeToUnix
     *
     */
    dateToUnix: function( date_str ){
	
	if ( !shedule.validateDate(date_str) ) {
	    return false;
	}
	
	var date_arr = date_str.split('.');
	var date = new Date( date_arr.reverse().join('-') );
	
	return date.getTime();
	
    },
    
    
    /**
     * Форма добавления занятия
     *
     */
    formInit: function( e, day_id ){
	
	if ( typeof day_id == 'undefined' ) {
	    
	    var el = e.target;
	    var is_edit = $(el).data('edit') == 1;
	    var tr = $(el).closest( 'tr' );
	    var day_id = tr.data( 'day' );
	    var is_not_regular = false;
	    
	}
	else{
	    
	    var is_not_regular = true;
	    var tr = $('#sheduleTable tr[data-day="'+day_id+'"]').last();
	    
	}
	
	var lesson_index = tr.prevAll('tr[data-day="'+day_id+'"]').size();
	var data_index = shedule.getDataIndex( day_id );
	
	//Убараем старую форму
	if( $('#addLessonForm2').size() > 0 ){
	    
	    shedule.updateTable( $('#addLessonForm2').closest( 'tr' ).data( 'day' ) );
	    
	}
	
	//if( is_not_regular ) return false;
	
	if ( !is_edit && data_index > -1 ) {
	    
	    lesson_index += 1;
	    var trs = $('#sheduleTable tr[data-day="'+day_id+'"]');
	    trs.eq(0).find('td:first').attr( 'rowspan', lesson_index + 1 );
	    
	    trs.last()
	    .after( '<tr class="lesson row-day" data-day="' + day_id + '"><td></td></tr>' );
	    
	    var td2 = $('#sheduleTable tr[data-day="'+day_id+'"]:last').find('td:first');
	    
	}else{
	    
	    var td = $('#sheduleTable tr[data-day="'+day_id+'"]').eq(lesson_index).find('td:last');
	    var td2 = td.prev('td');
	    td.remove();
	    
	}
	
	//Добавляем форму
	td2
	.removeClass('col-time table-time')
	.attr( 'colspan', '2' )
	.html( '<div class="lesson_edit" style="min-height: 100px;"></div>' );
	
	$('#addLessonForm')
	.clone(true)
	.appendTo( $( 'div.lesson_edit', td2 ) )
	.attr( { 'id': 'addLessonForm2' } )
	.fadeIn();
	
	//кнопки
	$('#addLessonForm2 .save-lesson').bind( 'click', function(){
		if ( is_edit ) {
		    shedule.saveLesson( day_id, lesson_index );
		}else{
		    shedule.saveLesson( day_id );
		}
		return false;
	    }
	);
	$('#addLessonForm2 .cancel-lesson').bind( 'click', function(){
		shedule.updateTable( day_id );
		return false;
	    }
	);
	
	//time picker
	$('.time-start,.time-end','#addLessonForm2').each( function(){
	    
	    $(this).datetimepicker( $.extend( {}, shedule.options.datetimepickerOpts, {
			datepicker: false,
			timepicker: true,
			onGenerate: function( current_time, input ){
			    $('.xdsoft_datetimepicker .xdsoft_disabled').remove();
			}
		    }
		)
	    );
	    
	} )
	.bind( 'blur', function(){
	    $( '.xdsoft_datetimepicker' ).hide();
	});
	
	shedule.autoFocusInit( '#addLessonForm2 .time-start' );
	
	//Занятия проходят не каждую неделю
	
	//not regular checkbox
	$('#addLessonForm2 input.lesson-not-regular')
	.bind('click',function(){
	    var parent = $(this).closest('.common_block');
	    if($(this).is(':checked')){
		parent.next('div.lesson-not-regular').show();
	    } else {
		parent.next('div.lesson-not-regular').hide();
	    }
	});
	
	$( '#addLessonForm2 input[name="notregular1"]' )
	.bind( 'click', function(){
	    if ( $(this).is(':checked') ) {
		if ( $( '#addLessonForm2 input[name="notregular3"]' ).is(':checked') ) {
		    $( '#addLessonForm2 input[name="notregular3"]' ).click();
		}
		$('#addLessonForm2 select[name="parity_week"]').removeAttr('disabled');
	    }else{
		$('#addLessonForm2 select[name="parity_week"]').attr('disabled','disabled');
	    }
	});
	
	$( '#addLessonForm2 input[name="notregular2"]' )
	.bind( 'click', function(){
	    if ( $(this).is(':checked') ) {
		if ( $( '#addLessonForm2 input[name="notregular3"]' ).is(':checked') ) {
		    $( '#addLessonForm2 input[name="notregular3"]' ).click();
		}
		$('#addLessonForm2 .lesson-not-regular .date-start').removeAttr('disabled');
		$('#addLessonForm2 .lesson-not-regular .date-end').removeAttr('disabled');
	    }else{
		$('.date-start,.date-end', '#addLessonForm2 .lesson-not-regular')
		.attr('disabled','disabled')
		.val( '__.__.____' );
	    }
	});
	
	$( '#addLessonForm2 input[name="notregular3"]' )
	.bind( 'click', function(){
	    if ( $(this).is(':checked') ) {
		if ( $( '#addLessonForm2 input[name="notregular1"]' ).is(':checked') ) {
		    $( '#addLessonForm2 input[name="notregular1"]' ).click();
		}
		if ( $( '#addLessonForm2 input[name="notregular2"]' ).is(':checked') ) {
		    $( '#addLessonForm2 input[name="notregular2"]' ).click();
		}
		$('#addLessonForm2 .lesson-not-regular .dates').removeAttr('disabled');
	    }else{
		$('#addLessonForm2 .lesson-not-regular .dates').attr('disabled','disabled').val('');
	    }
	});
	
	
	var data_index = shedule.getDataIndex( day_id );
	
	if ( !is_edit ) {
	    
	    //индекс занятия без учета занятий, которые  добавлены на одно и то же время
	    var lesson_current_index = shedule.getLessonFactIndex( data_index );
	    
	    //занятие проходит не каждую неделю
	    if ( is_not_regular ) {
		
		$('#addLessonForm2 input.time-start').val( shedule.data.lessons_days[data_index].lessons[ ( lesson_index - 1 ) ].time_start );
		$('#addLessonForm2 input.time-end').val( shedule.data.lessons_days[data_index].lessons[ ( lesson_index - 1 ) ].time_end );
		$('#addLessonForm2 input.lesson-not-regular').click();
		
		//выбираем радио-переключатель типа занятия, которое проходит не каждую неделю
		if ( shedule.data.lessons_days[data_index].lessons[ ( lesson_index - 1 ) ].parity ) {
		    
		    if ( shedule.data.lessons_days[data_index].lessons[ ( lesson_index - 1 ) ].parity == "1" ) {
			$('#addLessonForm2 select[name="parity_week"]').val("2");
		    }else{
			$('#addLessonForm2 select[name="parity_week"]').val("1");
		    }
		    $('#addLessonForm2 div.lesson-not-regular').find('input[name="notregular1"]').click();
		    
		}
		if ( shedule.data.lessons_days[data_index].lessons[ ( lesson_index - 1 ) ].date_end ) {
		    $('#addLessonForm2 div.lesson-not-regular').find('input[name="notregular2"]').click();
		}
		else if ( shedule.data.lessons_days[data_index].lessons[ ( lesson_index - 1 ) ].dates && shedule.data.lessons_days[data_index].lessons[ ( lesson_index - 1 ) ].dates.length > 0 ) {
		    $('#addLessonForm2 div.lesson-not-regular').find('input[name="notregular3"]').click();
		}
		
	    }
	    //время из расписания звонков
	    else if ( shedule.options.times[ lesson_current_index ] && shedule.options.times[ lesson_current_index ][0] != null ) {
		
		$('#addLessonForm2 input.time-start').val( shedule.options.times[ lesson_current_index ][0] );
		if( shedule.options.times[ lesson_current_index ][1] != null ){
		    $('#addLessonForm2 input.time-end').val( shedule.options.times[ lesson_current_index ][1] );
		}
	    }
	    //время из предыдущего дня + такое же время
	    else if ( data_index > -1 && shedule.data.lessons_days[data_index].lessons[ ( lesson_index - 1 ) ] ) {
		
		$('#addLessonForm2 input.time-start')
		.val( shedule.addTime( shedule.data.lessons_days[data_index].lessons[ ( lesson_index - 1 ) ].time_end, shedule.options.interval_lesson ) );
		
		$('#addLessonForm2 input.time-end')
		.val( shedule.addTime( $('#addLessonForm2 input.time-start').val(), shedule.options.minutes_length_lesson ) );
		
	    }
	    //время по умолчанию
	    else if ( data_index == -1 ) {
		
		$('#addLessonForm2 input.time-start').val( shedule.options.defaultTimeStart );
		
		$('#addLessonForm2 input.time-end').val( shedule.options.defaultTimeEnd );
		
	    }
	    
	}
	
	//даты от и до
	shedule.dateRangeInit( '#addLessonForm2 .lesson-not-regular .date-start', '#addLessonForm2 .lesson-not-regular .date-end', { weeks: true } );
	
	//список дат
	shedule.dateMultiInit( '#addLessonForm2 .dates', { weeks: true } );
	
	//Окно
	$('#addLessonForm2 input[name="skip_lesson"]').bind( 'click', function(){
		
		if ( !$(this).is(':checked') ) {
		    $( 'input,select', '#addLessonForm2 div.common_block' ).not('input[name="skip_lesson"]').removeAttr('disabled');
		    $( '#addLessonForm2 .teacher-lesson-input' ).select2( "enable", true );
		}else{
		    if ( $('#addLessonForm2 input.lesson-not-regular').is(':checked') ) {
			$('#addLessonForm2 input.lesson-not-regular').click();
		    }
		    $( '#addLessonForm2 .teacher-lesson-input' ).select2( "enable", false );
		    $( 'input,select', '#addLessonForm2 div.common_block').not('input[name="skip_lesson"]').prop( 'disabled', 'disabled' );
		}
		
	    }
	);
	
	//Преподаватель
	shedule.tagsSelectInit( '#addLessonForm2 .teacher-lesson-input', ['teachers', 'teacher'], ['преподавателя','преподавателя'], ['teacher_id', 'teacher_name'] );
	
	//Тип занятия
	shedule.select2Init( '#addLessonForm2 select.lesson-type' );
	
	//Аудитория
	shedule.tagsSelectInit( '#addLessonForm2 .class-lesson', ['auditories', 'auditory'], ['аудиторию','аудитория'], ['auditory_id', 'auditory_name', 'auditory_address'], shedule.auditory_callback );
	
	//Группа
	//shedule.tagsSelectInit( '#addLessonForm2 input[name="group"]', ['groups', 'group'], ['группу','группа'], ['group_id', 'group_name'] );
	shedule.popupSelectInit( '#addLessonForm2 .popup-select-fac', 'faculty', 'Выбрать факультет', function( data ){
	    
	    if( data && data.id ){
		
		$('#addLessonForm2 .popup-select-fac').text(data.title).data('value',data);
		
		shedule.groupsSelectUpdate( data.id, '#addLessonForm2 input[name="group"]' );
		
	    }else{
		
		$('#addLessonForm2 .popup-select-fac').text('Выбрать факультет').data('value','');
		$( '#addLessonForm2 input[name="group"]' ).select2( 'destroy' );
		shedule.input_data.groups = [];
		shedule.tagsSelectInit( '#addLessonForm2 input[name="group"]', ['groups', 'group'], ['группу','группа'], ['group_id', 'group_name'] );
		
	    }
	    
	});
	
	if ( is_edit ){
	    shedule.editInit( day_id, lesson_index );
	}
	
	//Обрезаем массив занятий, если их слишком много, иначе ошибка
	if ( shedule.input_data.lessons.length > 1500 ) {
	    shedule.input_data.lessons = shedule.input_data.lessons.slice( 0, 1500 );
	}
	
	$( "#addLessonForm2 .name-lesson" ).autocomplete({
	    source: [ shedule.input_data.lessons ],
	    valid: function( value,query ){
		return query.toLowerCase() == value.substr(0,query.length).toLowerCase();
	    },
	    /*
	    valid: function ( value, query ){
		console.log( value, query );
		return value.toLowerCase().indexOf(query.toLowerCase())!=-1;
	    }
	    */
	    showHint: true,
	    dropdownStyle: { display: 'none' }
	});
	
	return false;
	
    },
    
    /**
     * Окошко при добавлении аудитории
     *
     */
    auditory_callback: function( new_value ){
	
	if ( !shedule.data.auditory || shedule.data.auditory.length == 0 ) { return; }
	
	var last_item = shedule.data.auditory[ shedule.data.auditory.length - 1 ];
	
	if ( new_value !== null && !last_item.auditory_id && ( last_item.auditory_address === null || typeof last_item.auditory_address == 'undefined' ) ) {
	    
	    $('#popup-add-place input:text').val('');
	    $('#number-place').val( last_item.auditory_name );
	    setTimeout( function(){ $('[type="text"]:eq(1)','#popup-add-place').focus(); }, 500 );
	    $('.modal-overlay').show();
	    $('#popup-add-place').show();
	    shedule.data.auditory[ shedule.data.auditory.length - 1 ].auditory_address = '';
	    
	}
	
    },
    
    
    /**
     * Авто фокус в поле "время окончания занятия"
     *
     */
    autoFocusInit: function( selector ){
	
	$( selector )
	.bind( 'keyup', function(){
	    
	    if( $(this).is('.time-start') && shedule.getCaretPosition($(this).get(0)) == 5 ){
		var time_end = $(this).closest('div').find('.time-end');
		time_end.focus();
		shedule.setCaretPosition( time_end.get(0), 0 );
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
    
    
    /**
     * Показ окошка с полем email
     *
     */
    showDataWindow: function(e){
	
	console.log('showDataWindow');
	
	//Если активен вывод по датам, переводим занятия в обычный вид
	if ( app && /*app.options.shedule_type_name == 'dates' &&*/ app.options.shedule_type == 2 ) {
	    if( app.switchToDays ) app.switchToDays();
	}
	
	if( shedule.data.lessons_days.length == 0 && shedule.data.lessons_cycle.length == 0 ){
	    $('#error_message').text('Пожалуйста, заполните расписание.');
	    $(window).scrollTop(0);
	    return false;
	}
	
	var isValidForm = true;
	var dateStart = $('#dates .date-start').val();
	var dateEnd = $('#dates .date-end').val();
	var datesValid = shedule.validateDate( dateStart ) && shedule.validateDate( dateEnd );
	var dateOrder = datesValid ? shedule.dateToUnix(dateStart) < shedule.dateToUnix(dateEnd) : false;
	
	if ( dateOrder === false ) {
	    $('.date-start,.date-end','#dates').css('border-color','#ff0000');
	    var error_mess = !datesValid ? 'Проверьте дату начала/окончания семестра.' : 'Дата начала семестра должна быть раньше даты конца семестра.';
	    $('#error_message').text( error_mess );
	    isValidForm = false;
	}else{
	    $('.date-start,.date-end','#dates').removeAttr('style');
	    $('#error_message').text('');
	}
	
	if ( isValidForm ) {
	    $('#popup-confirm-email .sendform-error').text('');
	    $("#popup-confirm-email").show();
	    $('[type="text"]:first','#popup-confirm-email').focus();
	    $('.modal-overlay').show();
	}else{
	    $(window).scrollTop(0);
	}
	
	return false;
    },
    
    
    /**
     * Инициализация отправки расписания
     *
     */
    sendFormInit: function(){
	
	$('.email-submit').click(function(e){
	    
	    var email = $('#email');
	    
	    if( !shedule.validateEmail( email.val() ) ){
		email.css('border-color','#ff0000');
		e.preventDefault();
		return false;
	    } else {
		email.css('border-color','#bababa');
	    }
	    
	    var get_data = shedule.parseGetParams();
	    
	    //Проверяем даты
	    get_data.dateStart = $('#dates .date-start').val();
	    get_data.dateEnd = $('#dates .date-end').val();
	    
	    //Проверяем рекапчу
	    var recaptcha_response = grecaptcha.getResponse();
	    
	    if ( !recaptcha_response ) {
		$('#popup-confirm-email .sendform-error').text('Пожалуйста, подтвердите, что Вы не робот.');
		return false;
	    }
	    
	    shedule.data.faculties = [];
	    shedule.data.faculties[0] = {};
	    shedule.data.faculties[0].faculty_name = decodeURI( get_data.fac );
	    shedule.data.faculties[0].date_start = get_data.dateStart;
	    shedule.data.faculties[0].date_end = get_data.dateEnd;
	    
	    shedule.data.faculties[0].groups = [];
	    shedule.data.faculties[0].groups[0] = {};
	    shedule.data.faculties[0].groups[0].group_name = get_data.nameGroup;
	    
	    var lessons_days = [];
	    
	    for( var i in shedule.data.lessons_days ){
		if ( !shedule.data.lessons_days.hasOwnProperty(i) ) continue;
		
		var lessons = [];
		if ( shedule.data.lessons_days[i].lessons.length > 0 ) {
		    
		    for( var ii in shedule.data.lessons_days[i].lessons ){
			if ( !shedule.data.lessons_days[i].lessons.hasOwnProperty(ii) ) continue;
			
			//если не окно
			if ( shedule.data.lessons_days[i].lessons[ii].subject && shedule.data.lessons_days[i].lessons[ii].subject != 'skip' ) {
			    
			    //фильтруем аудитории
			    var auditories = [];
			    for( var iii in shedule.data.lessons_days[i].lessons[ii].auditories ){
				if ( !shedule.data.lessons_days[i].lessons[ii].auditories.hasOwnProperty(iii) ) continue;
				
				if ( shedule.data.lessons_days[i].lessons[ii].auditories[iii].auditory_name != 'Нет данных' ) {
				    auditories.push( shedule.data.lessons_days[i].lessons[ii].auditories[iii] );
				}
				
			    }
			    
			    lessons.push( shedule.data.lessons_days[i].lessons[ii] );
			    lessons[ ( lessons.length - 1 ) ].auditories = auditories;
			    
			}
			
		    }
		    
		}
		
		if ( lessons.length > 0 ) {
		    
		    lessons_days.push( { weekday: shedule.data.lessons_days[i].weekday, lessons: lessons } );
		    
		}
		
	    }
	    
	    //Циклические занятия
	    if ( app && app.options.shedule_type_name == 'cycle' && shedule.data.lessons_cycle.length > 0 ) {
		
		if ( app.options.shedule_type == 2 ) {
		    app.switchToDays();
		}
		
		//console.log( 'shedule.data.lessons_cycle', shedule.data.lessons_cycle );
		
		//Добавляем на каждый день с диапазоном дат
		if ( shedule.data.lessons_cycle.length > 0 ) {
		    
		    for( var day = 1; day <= 6; day++ ){
			
			var day_index = shedule.getDataIndex(day);
			
			if ( day_index == -1 || !lessons_days[day_index] ) {
			    lessons_days.push( { weekday: day, lessons: [] } );
			    day_index = lessons_days.length - 1;
			}
			
			for( var i = 0; i < shedule.data.lessons_cycle.length; i++ ){
			    
			    //если суббота, добавляем только отмеченные
			    if ( day == 6 && !shedule.data.lessons_cycle[i].sixdays ) {
				continue;
			    }
			    
			    var lesson = $.extend({},shedule.data.lessons_cycle[i]);
			    delete lesson.sixdays;
			    
			    lessons_days[day_index].lessons.push( lesson );
			    
			}
			
		    }
		    
		}
		
	    }
	    
	    //console.log( 'submit', lessons_days );
	    //return false;
	    
	    shedule.data.faculties[0].groups[0].days = lessons_days;
	    
	    var jsonData_obj = {
		captchaResponse: recaptcha_response,
		email: $("#email").val(),
		groupName: get_data.nameGroup,
		cityId: (isNaN(get_data.city) ? null : get_data.city),
		cityName: get_data.nameCity,
		idUniversity: (isNaN(get_data.univer) || !parseInt(get_data.univer) ? null : get_data.univer),
		idFaculty: (isNaN(get_data.idFac) || !parseInt(get_data.idFac) ? null : get_data.idFac),
		universityName: get_data.nameUniver,
		facultyName: get_data.fac,
		json: JSON.stringify( { faculties: shedule.data.faculties } )
	    };
	    
	    if( get_data.facLink ){
		jsonData_obj.facultyLink = decodeURI( get_data.facLink );
	    }
	    
	    //console.log(jsonData_obj);
	    //return;
	    
	    var jsonData = JSON.stringify( jsonData_obj );
	    
	    $('#popup-confirm-email input[name="email"]').attr( 'disabled', 'disabled' );
	    $('#popup-confirm-email .email-submit')
	    .after('<img src="' + shedule.options.imagesBaseUrl + 'image/loader.gif" />')
	    .hide();
	    
	    var step3_url = 'step3.html';
	    if ( parseInt( get_data.idFac ) == 0 ) {//Новый факультет
		step3_url += '#newfac';
	    }else if ( parseInt( get_data.idGroup ) == 0 ) {//Новая группа
		step3_url += '#new';
	    }
	    
	    $.ajax({
		url: shedule.options.apiUrl + 'schedule/new',
		type: "POST",
		contentType: 'application/json',
		dataType: 'json',
		async: true,
		data: jsonData,
		cache: false,
		success: function() {
		    window.location = step3_url;
		},
		error: function() {
		    //$("#sendform-error").text("Произошла ошибка, сервер не может обработать Ваш запрос. Напишите нам об этом.").fadeIn(200).delay(2000).fadeOut(1000);
		}
	    });
	    
	    setTimeout( function() { window.location.href = step3_url; }, 2000 );
	    
	    return false;
	    
	});
	
	/*
	$('.added-email-overlay').click(function(event) {
	    e = event || window.event;
	    if (e.target == this) {
		$(this).css('display', 'none');
		$('body').css('overflow','y-scroll');
	    }
	});
	*/
    },
    
    /**
     * Дата начала сессии для календаря
     *
     */
    getSessionStartOpts: function(){
	
	//Начало сессии для отображения номеров недель
	var opts = {};
	var startSession = $('#dates .date-start').val();
	
	if ( startSession && startSession.length > 0 && shedule.validateDate( startSession ) ) {
	    var startSession_arr = startSession.split('.');
	    opts.weeks = true;
	    opts.weekDayStartYear = parseInt(startSession_arr[2]);
	    opts.weekDayStartMonth = parseInt(startSession_arr[1]) - 1;
	    opts.weekDayStartDay = parseInt(startSession_arr[0]);
	}
	
	return opts;
	
    },
    
    /**
     * Расписание звонков
     *
     */
    bellsFormInit: function(){
	
	$('#sheduleBells .timepicker')
	.datetimepicker( $.extend( {}, shedule.options.datetimepickerOpts, {
		    datepicker: false,
		    timepicker: false,
		    lazyInit: false,
		    onGenerate: function( current_time, input ){
			//$('.xdsoft_datetimepicker .xdsoft_disabled').remove();
			$('.xdsoft_datetimepicker').hide();
		    }
		}
	    )
	)
	.bind( 'focus', function(){
	    
	    var value = $(this).val();
	    
	    if ( !value || value == '__:__' ) {
		
		var index = $(this).prevAll('input').size();
		var column_index = $(this).parent('div').parent('div').prev('.column-50').size();
		if( index == 0 ){
		    
		    if( $(this).parent().prev('div').size() == 0 ){
			
			if ( column_index == 0 ) {
			    $(this).val( shedule.options.defaultTimeStart );
			}else{
			    var prev_value = $('#sheduleBells .column-50:first').find('input[type="text"]:last').val();
			    if( prev_value && shedule.validateTime( prev_value ) ){
				var new_time = shedule.addTime( prev_value, shedule.options.interval_lesson );
				if( shedule.validateTime( new_time ) ) $(this).val( new_time );
			    }
			}
			
		    }else{
			var prev_value = $(this).parent().prev('div').find('input[type="text"]:last').val();
			if( prev_value && shedule.validateTime( prev_value ) ){
			    var new_time = shedule.addTime( prev_value, shedule.options.interval_lesson );
			    if( shedule.validateTime( new_time ) ) $(this).val( new_time );
			}
		    }
		}else{
		    var prev_value = $(this).prev('input').val();
		    if( prev_value && shedule.validateTime( prev_value ) ){
			var new_time = shedule.addTime( prev_value, shedule.options.minutes_length_lesson );
			if( shedule.validateTime( new_time ) ) $(this).val( new_time );
		    }
		}
		
	    }
	    
	})
	.bind( 'blur', function(){
	    
	    var index = $(this).prevAll('input').size();
	    var column_index = $(this).parent('div').parent('div').prev('.column-50').size();
	    var row_index = $(this).parent('div').prevAll('.row').size();
	    var time_value = $(this).val();
	    
	    var errors = shedule.validateTimeFields( $(this) );
	    if ( errors > 0 ) return;
	    
	    //время всей пары
	    if( index > 0 ){
		var prev_value = $(this).prev('input').val();
		if ( shedule.validateTime( time_value ) && shedule.validateTime( prev_value ) ) {
		    shedule.options.minutes_length_lesson = shedule.timeToMinutes( time_value ) - shedule.timeToMinutes( prev_value );
		}
	    }
	    //время перерыва между парами
	    else if ( index == 0 && row_index > 0 ) {
		var prev_value = $(this).parent().prev('div').find('input[type="text"]:last').val();
		if ( shedule.validateTime( time_value ) && shedule.validateTime( prev_value ) ) {
		    shedule.options.interval_lesson = shedule.timeToMinutes( time_value ) - shedule.timeToMinutes( prev_value );
		}
	    }
	    
	});
	
	shedule.autoFocusInit( '#sheduleBells .time-start' );
	
	$('#bells-schedule-button').bind( 'click', function(){
		
		$('.modal-overlay').show();
		$('#sheduleBells').show();
		$('#sheduleBells .timepicker').removeAttr('style');
		
		return false;
	    }
	);
	
	//сохранение
	$('#sheduleBells .btn-save').bind( 'click', function(){
		
		var times_arr = [];
		
		var errors = shedule.validateTimeFields( '#sheduleBells input.timepicker' );
		
		$('#sheduleBells .row-time').each( function(i){
			
			var tmp_arr = [];
			$( 'input[type="text"]', this ).each( function(i){
				
				var this_value = $(this).val();
				var is_valid = shedule.validateTime( this_value );
				//если это окончание пар, проверяем что время указано верно
				if ( is_valid && i == 1 ) {
				    var prev_time = $(this).parent().find('input[type="text"]:first').val();
				    is_valid = shedule.timeToMinutes(this_value) > shedule.timeToMinutes(prev_time);
				}
				
				if( is_valid ){
				    tmp_arr.push( this_value );
				}else{
				    tmp_arr.push( null );
				}
				
			    }
			);
			
			times_arr.push( tmp_arr );
			
		    }
		);
		
		shedule.options.times = times_arr;
		
		if ( errors == 0 ) {
		    $('.modal-overlay').hide();
		    $('#sheduleBells').hide();
		}
		
		//shedule.fillBellsFields();
		
		return false;
	    }
	);
	
	//отмена
	$('#sheduleBells .btn-cancel').bind( 'click', shedule.fillBellsFields );
	
    },
    
    /**
     * Проверка заполнения полей дат с подсцветкой ошибок
     *
     */
    validateTimeFields: function( selector ){
	
	var errors = 0;
	
	if ( $( selector ).size() == 2 && $( selector ).eq(0).val() == $( selector ).eq(1).val() ) {
	    
	    $( selector ).css( 'border-color','#ff0000' );
	    errors = 2;
	    
	}else{
	    
	    $( selector ).each( function(){
		
		var time_value = $(this).val();
		var is_valid = !time_value || time_value == '__:__' || shedule.validateTime( time_value );
		
		if ( time_value && is_valid ) {
		    
		    var index = $(this).is('.time-end') ? 1 : $(this).prevAll('input:text').size();
		    
		    //если это окончание пар, проверяем что время указано верно
		    if ( is_valid && index == 1 ) {
			var prev_time = $(this).closest('div').find('input[type="text"]:first').val();
			if( prev_time && shedule.timeToMinutes(time_value) < shedule.timeToMinutes(prev_time)){
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
    
    
    /**
     * Проверка дат включая очередность
     *
     */
    validateDatesRange: function( selector_from, selector_to ){
	
	var is_valid = true;
	var date_start = $( selector_from ).val();
	var date_end = $( selector_to ).val();
	if ( date_start == '__.__.____' ) { date_start = ''; }
	if ( date_end == '__.__.____' ) { date_end = ''; }
	
	if ( date_start && date_end ) {
	    if( !shedule.validateDate(date_start) || !shedule.validateDate(date_end) || shedule.dateToUnix(date_start) > shedule.dateToUnix(date_end) ){
		$( selector_from ).css( 'border-color','#ff0000' );
		$( selector_to ).css( 'border-color','#ff0000' );
		is_valid = false;
	    }else{
		$( selector_from ).removeAttr('style');
		$( selector_to ).removeAttr('style');
	    }
	}
	
	return is_valid;
	
    },
    
    /**
     * Проверка списка дат
     *
     */
    validateMultiDates: function( selector, out_type ){
	
	out_type = out_type || 'array';
	var dates_field = $( selector );
	dates_field.css('border-color','#bababa');
	var dts = dates_field.val().split(',');
	var dates_error = false;
	var dates_arr = [];
	$.each(dts, function(key, val){
	    if( shedule.validateDate( $.trim( val ) ) && $.inArray( $.trim( val ), dates_arr ) == -1 ){
		dates_arr.push( $.trim( val ) );
	    }else{
		dates_error = true;
	    }
	});
	
	if ( dates_error ) {
	    dates_field.css('border-color','#ff0000');
	}
	
	return out_type == 'array' ? dates_arr : dates_error;
	
    },
    
    
    /**
     * Заполнение полей расписания звонков
     *
     */
    fillBellsFields: function(){
	
	$('#sheduleBells .timepicker').val('__:__');
	
	if ( shedule.options.times.length > 0 ) {
	    
	    for( var i in shedule.options.times ){
		if ( !shedule.options.times.hasOwnProperty(i) || !shedule.options.times[i] ) continue;
		
		for( var ii in shedule.options.times[i] ){
		    if ( !shedule.options.times[i].hasOwnProperty(ii) ) continue;
		    
		    if ( shedule.options.times[i][ii] != null ) {
			$('#sheduleBells .row-time').eq(i)
			.find('.timepicker:eq('+ii+')')
			.val(shedule.options.times[i][ii]);
		    }
		    
		}
		
	    }
	    
	}
	
    },
    
    
    /**
     * Новое расписание (очистка)
     *
     */
    cleanSheduleInit: function(){
	
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
		    
		    shedule.data.lessons_days = [];
		    shedule.data.lessons_cycle = [];
		    shedule.updateTable();
		    shedule.onDataChange();
		    
		    //Очистка в другой вклаке
		    if ( app && typeof app.cleanShedule == 'function' ) {
			app.cleanShedule();
		    }
		    
		}
	    }
	    return false;
	});
	
    },
    
    
    /**
     * Селект с автодополнением
     *
     */
    searchSelectInit: function( el_selector, data_key, return_data_key, msg_arr, callback, field_id, field_name ){
	
	var opts = {
	    //minimumInputLength: 3,
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
	
	shedule.data[ return_data_key ] = {};
	
	$( el_selector + ':first' ).select2( $.extend( {}, opts, {
		formatNoMatches: function( term ){
		    return 'добавить ' + msg_arr[0];
		},
		query: function (query) {
		    
		    var element = $(this)[0].element;
		    var data = { results: [] };
		    
		    $.each( shedule.input_data[ data_key ], function(){
			if( query.term.length == 0 || this[field_name].toUpperCase().indexOf(query.term.toUpperCase()) >= 0 ){
			    var tmp_obj = {};
			    tmp_obj.id = this[field_id];
			    tmp_obj[field_id] = this[field_id];
			    tmp_obj[field_name] = this[field_name];
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
			    var results = [ { text: return_data_key, children: new_value }, tmp_obj ];
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
		shedule.data[ return_data_key ] = new_value;
	    }
	    
	    if ( typeof callback == 'function' ) {
		callback( new_value );
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
	
    },
    
    /**
     * tagsSelectInit
     *
     */
    tagsSelectInit: function( selector, data_keys, msg_arr, data_fields, callback ){
	
	//Example: '#addLessonForm2 .teacher-lesson-input', ['teachers', 'teacher'], ['teacher_id', 'teacher_name']
	
	if ( $( selector ).size() == 0 ) { return; }
	
	shedule.data[ data_keys[1] ] = [];
	
	var tags = shedule.getTagsArray( data_keys[0], data_fields );
	
	var opts = {
	    multiple: true,
	    separator: '|',
	    tags: tags,
	    formatNoMatches: function( term ){
		return 'добавить ' + msg_arr[0];
	    }
	};
	
	$( selector )
	.select2( opts )
	.on("change", function(e) {
	    
	    var new_value = e.added || $(e.target).select2('data');
	    var values = $(e.target).select2( 'val' );
	    
	    shedule.getSelectedData( values, data_keys, data_fields );
	    
	    if ( !e.added ) { new_value = null; }
	    if ( typeof callback == 'function' ) {
		callback( new_value );
	    }
	    
	});
	
	if( $( selector ).data('value') ){
	    
	    var data_arr = [];
	    var data = $( selector ).data('value');
	    for( var i in data ){
		if ( data.hasOwnProperty(i) ) {
		    if ( data[i][ data_fields[1] ] == 'Нет данных' ) { continue; }
		    data_arr.push( data[i][ data_fields[1] ] );
		}
	    }
	    
	    if( data_arr.length > 0 ) {
		$( selector ).select2( 'val', data_arr );
		shedule.data[ data_keys[1] ] = data;
	    }
	    
	    //console.log('tagsSelectInit',data);
	    
	    //shedule.data[ data_keys[1] ]
	    
	}
	
    },
    
    
    /**
     * popupSelectInit
     *
     */
    popupSelectInit: function( selector, data_name, title, callback ){
	
	if ( $( selector ).size() > 0 ) {
	    
	    $( selector ).bind('click',function(){
		
		$('#popup-select').remove();
		
		var popup_html = '<div class="modal" id="popup-select">\
		<div class="modal-b">\
		<div class="headline-title-text popup-headline">' + title + '</div>';
		
		popup_html += '<br /><div class="text-center"><input type="hidden" name="' + data_name + '"></div><br />';
		
		popup_html += '<div class="buttons-row"><div class="button-left"><div class="btn-cancel-add btn-cancel"><a href="#">Отменить</a>\
		</div></div>\
		<div class="btn-save float-left"><a href="#">Сохранить</a>\
		</div></div></div></div>';
		
		$(document.body).append( popup_html );
		$('#popup-select').css({minHeight:'200px'}).show();
		$('.modal-overlay').show();
		
		//Пока только для факультетов, если надо можно сделать универсально
		shedule.searchSelectInit( '#popup-select [name="' + data_name + '"]', 'faculties', 'faculty', ['факультет','факультет'], null, 'id', 'title' );
		
		if ( shedule.input_data.faculties.length == 0 ) {
		    
		    $('#popup-select [name="' + data_name + '"]').select2( 'enable', false );
		    $('#popup-select [name="' + data_name + '"]').data('select2').container.addClass('loading');
		    var get_data = shedule.parseGetParams();
		    
		    shedule.getData( get_data.univer, 'faculties', function(){
			$('#popup-select [name="' + data_name + '"]').select2( 'enable', true );
			$('#popup-select [name="' + data_name + '"]').data('select2').container.removeClass('loading');
		    });
		    
		}
		
		var data_value = $( selector ).data('value');
		if( data_value ){
		    $('#popup-select [name="' + data_name + '"]').select2( 'data', data_value );
		}else{
		    $('#popup-select [name="' + data_name + '"]').select2( 'data', null );
		}
		
		//Сохранить
		$('#popup-select .btn-save > a').bind('click',function(){
		    
		    var data = $('#popup-select [name="' + data_name + '"]').select2( 'data' );
		    
		    if ( typeof callback == 'function' ) {
			callback( data );
		    }
		    
		    $('#popup-select').remove();
		    $('.modal-overlay').hide();
		    return false;
		});
		
		//Отмена
		$('#popup-select .btn-cancel > a').bind('click',function(){
		    $('#popup-select').remove();
		    $('.modal-overlay').hide();
		    return false;
		});
		
		return false;
	    });
	    
	}
	
    },
    
    
    /**
     * groupsSelectUpdate
     *
     */
    groupsSelectUpdate: function( fac_id, selector ){
	
	if ( !$( selector ).data( 'select2' ) ) {
	    shedule.tagsSelectInit( selector, ['groups', 'group'], ['группу','группа'], ['group_id', 'group_name'] );
	}
	
	$( selector  ).select2( 'enable', false );
	setTimeout(function(){
	    $( selector ).data('select2').container.addClass('loading');
	},10);
	
	//Запрашиваем список групп по факультету
	shedule.getData( fac_id, 'faculty_groups', function(){
	    
	    for( var i in shedule.input_data.groups ){
		if ( !shedule.input_data.groups.hasOwnProperty( i ) ) continue;
		shedule.input_data.groups[i].group_id = shedule.input_data.groups[i].id;
		shedule.input_data.groups[i].group_name = shedule.input_data.groups[i].title;
	    }
	    
	    $( selector ).select2( 'enable', true );
	    $( selector ).select2( 'destroy' );
	    shedule.tagsSelectInit( selector, ['groups', 'group'], ['группу','группа'], ['group_id', 'group_name'] );
	    
	});
	
    },
    
    
    /**
     * Превращает массив объектов в массив строк (прет только названия)
     *
     */
    getTagsArray: function( data_key, data_fields ){
	
	var tags = [], arr_count = {};
	
	for( var i in shedule.input_data[data_key] ){
	    if ( shedule.input_data[data_key].hasOwnProperty(i) ) {
		var tag_value = shedule.input_data[data_key][i][data_fields[1]];
		//if ( !tag_value ) { continue; }
		/*if ( $.inArray( tag_value, tags ) > -1 ) {
		    arr_count[tag_value] = arr_count[tag_value] ? arr_count[tag_value] + 1 : 1;
		    tag_value += ' (' + ( arr_count[tag_value] + 1 ) + ')';
		    if ( data_fields[2] ) {
			//tag_value += ' - ' + shedule.input_data[data_key][i][data_fields[2]];
		    }
		}*/
		tags.push( tag_value );
	    }
	}
	
	return tags;
	
    },
    
    
    /**
     * select2Init
     *
     */
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
	});
	/*.on("select2-open", function( e ) {
	    $('.select2-drop:visible .select2-search').hide();
	});*/
	
    },
    
    
    /**
     * Даты "от" и "по"
     *
     */
    dateRangeInit: function( inputDateIn, inputDateOut, opts ){
	
	$( inputDateIn ).datetimepicker( $.extend( {}, shedule.options.datetimepickerOpts, {
		    datepicker: true,
		    timepicker: false,
		    format:'d.m.Y',
		    onShow:function( ct ){
			
			var options = opts || {};
			if( options.weeks ){
			    options = shedule.getSessionStartOpts();
			}
			options.minDate = shedule.validateDate( $( inputDateOut ).val() ) ? $( inputDateOut ).val() : false;
			
			this.setOptions(options);
			
		    }
		}
	    )
	)
	.bind( 'blur', function(){
	    $( '.xdsoft_datetimepicker' ).hide();
	});
	
	$( inputDateOut ).datetimepicker( $.extend( {}, shedule.options.datetimepickerOpts, {
		    datepicker: true,
		    timepicker: false,
		    format:'d.m.Y',
		    onShow:function( ct ){
			
			var options = opts || {};
			if( options.weeks ){
			    options = shedule.getSessionStartOpts();
			}
			options.minDate = shedule.validateDate(  $( inputDateIn ).val() ) ? $( inputDateIn ).val() : false;
			
			this.setOptions(options);
			
		    }
		}
	    )
	);
	
    },
    
    //Список дат
    dateMultiInit: function( selector, opts ){
	
	//заполнение списка дат
	var datesOpts = $.extend( {}, shedule.options.datetimepickerOpts, {
		datepicker: true,
		timepicker: false,
		mask: false,
		format: 'd.m.Y',
		closeOnDateSelect: false,
		onShow: function( current_time, input ){
		    
		    var current_value = input.val();
		    input.data( 'dates_list', current_value );
		    
		    
		    var options = opts || {};
		    if( options.weeks ){
			options = shedule.getSessionStartOpts();
			this.setOptions(options);
		    }
		    
		},
		onClose: function( current_time, input ){
		    
		    var current_value = input.val();
		    var current_value_arr = current_value.split(',');
		    var dates_arr = [];
		    
		    for( var i in current_value_arr ){
			if ( !current_value_arr.hasOwnProperty(i) ) continue;
			
			if( shedule.validateDate( $.trim( current_value_arr[i] ) ) ){
			    dates_arr.push( $.trim( current_value_arr[i] ) );
			}
			
		    }
		    if ( input.data( 'dates_list' ) ) {
			setTimeout( function(){
			    input.val( dates_arr.join(', ') );
			    input.data( 'dates_list', dates_arr.join(', ') );
			}, 10 );
		    }
		    
		},
		onSelectDate: function( current_time, input ){
		    
		    var current_value = input.val();
		    var dates_list = input.data( 'dates_list' );
		    
		    if ( typeof dates_list == 'undefined' ) { dates_list = ''; }
		    dates_list = dates_list + ( dates_list != '' ? ', ' : '') + current_time.dateFormat('d.m.Y');
		    input.data( 'dates_list', dates_list );
		    input.val(dates_list);
		    
		}
	    }
	);
	$( selector ).datetimepicker( datesOpts );
	
    },
    
    
    /**
     * Показ блока "Добавить/Редактировать" при наведении
     *
     */
    overlayOnOverInit: function(){
	
	//lesson-overlay
        $(document).on( 'mouseenter mouseleave', '#sheduleTable .cell-lesson-cont', function( e ){
            
	    e.stopPropagation();
	    
            var cell = $( e.target ).is( '.cell-lesson-cont' ) ? $( e.target ) : $( e.target ).closest( '.cell-lesson-cont' );
            
            if ( e.type == 'mouseenter' ) {
                
                cell.append( shedule.options.lesson_overlay_html );
		if ( !cell.parent( 'td' ).is( '.cell-lesson-empty' ) ){
		    
		    $( '#lesson-overlay > div > div' )
		    .removeClass('popup-add-lesson')
		    .addClass('popup-edit-lesson')
		    .find('a.add')
		    .data( 'edit', 1 )
		    .text('Редактировать');
		    
		    $( 'a.remove', $( '.lesson-overlay', cell ) ).css( 'display', 'inline-block' );
		    
		    var tr = cell.closest('tr');
		    var day_id = tr.data('day');
		    if ( cell.closest('tr').nextAll('[data-day="'+day_id+'"]').size() == 0 ) {
			$( 'a.add', $( '.lesson-overlay', cell ) ).css( 'display', 'inline-block' );
		    }else{
			if( cell.parent().is('.skip') ){
			    cell.parent().addClass('skip-nofirst');
			}
		    }
		    
		}
                
                $( '.lesson-overlay', cell )
                .css(
                    {
                        width: cell.parent('td').innerWidth() + 'px',
                        height: cell.parent('td').innerHeight() + 'px'
                    }
                )
                .show();
                
            }
            else if( e.type == 'mouseleave' ){
                $( '.lesson-overlay' ).not('.on-hover').remove();
            }
            
        } );
	
	//Редактировать занятие
        $(document).on( 'click', '#lesson-overlay a.add', shedule.formInit );
	//Удалить занятие
	$(document).on( 'click', '#lesson-overlay a.remove', shedule.removeLesson );
	
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
    
    /**
     * Проверка времени
     *
     */
    validateTime: function ( time ) {
	
	var is_valid = /\d{2}\:\d{2}/.test( time );
	if ( is_valid ) {
	    is_valid = ( shedule.timeToMinutes(time) / 60 ) < 24;
	}
	return is_valid;
    },
    
    /**
     * deleteYear
     *
     */
    deleteYear: function( date ){
	var path = date.split('.');
	return path[0] + '.' + path[1];
    },
    
    
    /**
     * validateEmail
     *
     */
    validateEmail: function( email ){
	
	var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test( email );
	
    },
    
    
    /**
     * Возвращает индекс дня в массиве занятий
     *
     */
    getDataIndex: function( day_id ){
	
	var data_index = -1;
	for( var i in shedule.data.lessons_days ){
	    if ( !shedule.data.lessons_days.hasOwnProperty( i ) ) continue;
	    
	    if ( shedule.data.lessons_days[i].weekday == day_id /*&& shedule.data.lessons_days[i].lessons.length > 0*/ ) {
		data_index = i;
		break;
	    }
	    
	}
	
	return data_index;
	
    },
    
    
    /**
     * Индекс занятия без учета занятий, которые  добавлены на одно и то же время
     *
     */
    getLessonFactIndex: function( data_index ){
	
	var index = 0;
	
	if ( shedule.data.lessons_days[ data_index ] && shedule.data.lessons_days[ data_index ].lessons.length > 0 ) {
	    
	    var lessons = shedule.data.lessons_days[ data_index ].lessons;
	    
	    for( var i in lessons ){
		if ( !lessons.hasOwnProperty( i ) ) continue;
		
		if ( i == 0 ) {
		    index++;
		    continue;
		}
		
		if( lessons[i].time_start != lessons[(i-1)].time_start && lessons[i].time_end != lessons[(i-1)].time_end ){
		    index++;
		}
		
	    }
	    
	}
	
	return index;
	
    },
    
    
    /**
     * addTime
     *
     */
    addTime: function( time_str, add_min ){
	
	var time_arr = time_str.split(':');
	time_arr[0] = parseInt( time_arr[0] );
	time_arr[1] = parseInt( time_arr[1] );
	
	if ( time_arr[1] + add_min < 60 ) {
	    
	    var mins = time_arr[1] + add_min;
	    var hours = time_arr[0];
	    
	}else{
	    
	    var mins = time_arr[1] + add_min;
	    var hours = time_arr[0] + Math.floor( mins / 60 );
	    mins = mins % 60;
	    
	}
	
	if( hours / 24 > 1 ){
	    hours = hours % 24;
	}
	
	return ( hours < 10 ? '0' : '' ) + hours + ':' + ( mins < 10 ? '0' : '' ) + mins;
	
    },
    
    
    /**
     * editinit
     *
     */
    editInit: function( day_id, lesson_index ){
	
	var data_index = shedule.getDataIndex( day_id );
	var lesson = shedule.data.lessons_days[data_index].lessons[lesson_index];
	
	$('#addLessonForm2 .time-start').val( lesson.time_start );
	$('#addLessonForm2 .time-end').val( lesson.time_end );
	if( lesson.subject != 'skip' ) $('#addLessonForm2 .name-lesson').val( lesson.subject );
	if( lesson.type > -1 ){
	    $('#addLessonForm2 .lesson-type').select2( 'val', lesson.type );
	}
	
	//teachers
	if( lesson.teachers && lesson.teachers.length > 0 ){
	    
	    var teachers_arr = [];
	    for( var ii in lesson.teachers ){
		if ( lesson.teachers.hasOwnProperty(ii) ) {
		    teachers_arr.push( lesson.teachers[ii].teacher_name );
		}
	    }
	    $('#addLessonForm2 .teacher-lesson-input').select2( 'val', teachers_arr );
	    shedule.data.teacher = lesson.teachers;
	    
	}
	
	//groups
	if( lesson.groups && lesson.groups.length > 0 ){
	    
	    shedule.tagsSelectInit( '#addLessonForm2 input[name="group"]', ['groups', 'group'], ['группу','группа'], ['group_id', 'group_name'] );
	    
	    var groups_arr = shedule.getNamesArr( lesson.groups, 'group_name' );
	    
	    $('#addLessonForm2 input[name="group"]').select2( 'val', groups_arr );
	    
	    shedule.data.group = lesson.groups;
	    
	}
	
	//auditories
	if( lesson.auditories && lesson.auditories.length > 0 ){
	    
	    var auditories_arr = [];
	    for( var ii in lesson.auditories ){
		if ( lesson.auditories.hasOwnProperty(ii) ) {
		    if ( lesson.auditories[ii].auditory_name != 'Нет данных' ) {
			auditories_arr.push( lesson.auditories[ii].auditory_name );
		    }
		}
	    }
	    $('#addLessonForm2 .class-lesson').select2( 'val', auditories_arr );
	    shedule.data.auditory = lesson.auditories;
	    
	}
	
	/*
	if( lesson.auditories && lesson.auditories[0].auditory_name ){
	    $('#addLessonForm2 select.class-lesson').select2( "val", lesson.auditories[0].auditory_name );
	}
	*/
	
	if( lesson.subject == 'skip' ){
	    $('#addLessonForm2 input[name="skip_lesson"]').click();
	    
	}
	
	var not_regular = false;
	
	if ( $.inArray( parseInt(lesson.parity), [1,2] ) > -1 || ( ( lesson.dates && lesson.dates.length > 0 ) || lesson.date_start || lesson.date_end ) ) {
	    
	    $('#addLessonForm2 input.lesson-not-regular').click();
	    
	    if ( $.inArray( parseInt(lesson.parity), [1,2] ) > -1 ) {
		
		$('#addLessonForm2 div.lesson-not-regular')
		.find( 'input[name="notregular1"]' ).click();
		
		$('#addLessonForm2 select[name="parity_week"]').val( lesson.parity );
		
	    }
	    
	    var container = $('#addLessonForm2 div.lesson-not-regular');
	    
	    if ( lesson.date_start || lesson.date_end ) {
		
		container
		.find( 'input[data-order="2"]' ).click();
		
		if( lesson.date_start ) container.find('.date-start').val( lesson.date_start );
		if( lesson.date_end ) container.find('.date-end').val( lesson.date_end );
		
	    }
	    else if ( lesson.dates && lesson.dates.length > 0 ) {
		
		container
		.find( 'input[data-order="3"]' ).click();
		
		container
		.find( '.dates' ).val( lesson.dates.join(',') );
		
	    }
	    
	}
	
    },
    
    
    /**
     * addPlaceInit
     *
     */
    addPlaceInit: function(){
	
	$('#addPlace').click(function(){
	    
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
		var adPl = '';
	    }
	    
	    if( nPl ) nPl = nPl.replace( /[\<\>"]/g, '' );
	    if( adPl ) adPl = adPl.replace( /[\<\>"]/g, '' );
	    
	    var auditory = { id: 0, auditory_id: 0, auditory_name: nPl };
	    auditory.auditory_address = adPl;
	    
	    
	    //Если активна вторая вкладка (цикловые занятия)
	    if ( app && app.options.shedule_type_name == 'cycle' && app.options.shedule_type == 2 ) {
		
		app.addPlace( nPl, adPl );
		
	    }else{
		
		shedule.data.auditory[ shedule.data.auditory.length - 1 ].auditory_name = nPl;
		shedule.data.auditory[ shedule.data.auditory.length - 1 ].auditory_address = adPl;
		
	    }
	    
	    $('.modal,.modal-overlay').hide();
	    
	    return false;
	    
	});
	/*
	$('.btn-cancel-add').click(function() {
	    $('.popup-add-place-overlay').css('display', 'none');
	    $(this).parent().children('option:first').attr('selected', 'selected');
	    return false;
	});
	*/
    },
    
    
    /**
     * Сортирует входные данные по алфавиту 
     *
     */
    sortingData: function( data_name ){
	
	if ( !shedule.input_data[ data_name ] ) { return; }
	
	switch ( data_name ){
	    case "auditories":
		var key = 'auditory_name';
	    break;
	    case "teachers":
		var key = 'teacher_name';
	    break;
	    case "groups":
		var key = 'group_name';
	    break;
	    default:
		var key = 'title';
	    break;
	}
	
	shedule.input_data[ data_name ] = shedule.input_data[ data_name ].sort(function(a, b) {
	    return a[key].toLowerCase() == b[key].toLowerCase() ? 0 : a[key].toLowerCase() < b[key].toLowerCase() ? -1 : 1;
	});
	
    },
    
    
    /**
     * Сортировка занятий по времени
     *
     */
    sortLessons: function( data_index ){
	
	if( shedule.data.lessons_days[ data_index ] ){
	    
	    shedule.data.lessons_days[ data_index ].lessons = shedule.data.lessons_days[ data_index ].lessons.sort(function(a, b) {
		return parseFloat(a.time_start.replace(':','.')) > parseFloat(b.time_start.replace(':','.'))
	    });
	    
	}
	
    },
    
    
    /**
     * saveLesson
     *
     */
    saveLesson: function( day_id, lesson_index, add_more ){
	
	if( typeof add_more == 'undefined' ) var add_more = null;
	if( typeof lesson_index == 'undefined' ) var lesson_index = null;
	var lesson = {};
	var lesson_not_regular = $('#addLessonForm2 input.lesson-not-regular').is(':checked') && $('#addLessonForm2 div.lesson-not-regular').find('input[type="checkbox"]:checked').size() > 0;
	var is_empty_lesson = $('#addLessonForm2 input[name="skip_lesson"]').is(':checked');
	
	var errors = shedule.validateTimeFields( '#addLessonForm2 .time-start, #addLessonForm2 .time-end' );
	if ( !is_empty_lesson && !$('#addLessonForm2 .name-lesson').val() ) {
	    $('#addLessonForm2 .name-lesson').css( 'border-color','#ff0000' );
	    errors++;
	}else{
	    $('#addLessonForm2 .name-lesson').removeAttr('style');
	}
	if ( errors > 0 ) {
	    return false;
	}
	
	//Выводим вопрос, если занятие не каждую неделю
	if ( add_more === null && lesson_index === null && lesson_not_regular ) {
	    
	    var confirm_block = '<div class="col right buttons-confirm" style="display:none;"> \
	    <p>Добавить еще одно занятие на это же время?</p> \
	    <div> \
	    <a href="#">Да</a> \
	    <a href="#">Нет</a> \
	    </div> \
	    </div>';
	    var buttons_row = $('#addLessonForm2 .btn-save').parent().parent();
	    buttons_row
	    .hide()
	    .parent()
	    .append( confirm_block );
	    
	    $('#addLessonForm2 .buttons-confirm')
	    .fadeIn()
	    .find('a:first')
	    .bind( 'click', function(){
		shedule.saveLesson( day_id, null, true );
		return false;
	    })
	    .next('a')
	    .bind( 'click', function(){
		shedule.saveLesson( day_id, null, false );
		return false;
	    })
	    
	    return false;
	}
	
	lesson.time_start = $('#addLessonForm2 .time-start').val();
	if ( !shedule.validateTime( lesson.time_start ) ) {
	    lesson.time_start = '00:00';
	}
	
	lesson.time_end = $('#addLessonForm2 .time-end').val();
	if ( !shedule.validateTime( lesson.time_end ) ) {
	    lesson.time_end = '23:59';
	}
	
	//если окно
	if ( is_empty_lesson ) {
	    
	    lesson.subject = 'skip';
	    lesson.type = -1;
	    lesson.parity = 0;
	    
	}
	//не окно
	else{
	    
	    lesson.subject = $.trim( $('#addLessonForm2 .name-lesson').val() );
	    lesson.type = parseInt( $('#addLessonForm2 .lesson-type').select2("val") );
	    
	    lesson.teachers = shedule.data.teacher && shedule.data.teacher.length > 0 ? shedule.data.teacher : null;
	    lesson.auditories = shedule.data.auditory && shedule.data.auditory.length > 0 ? shedule.data.auditory : null;
	    lesson.groups = shedule.data.group && shedule.data.group.length > 0 ? shedule.data.group : null;
	    
	    if( lesson_not_regular ){
		
		lesson.parity = null;
		lesson.dates = [];
		if( $( '#addLessonForm2 input[name="notregular1"]' ).is( ':checked' ) ){
		    lesson.parity = $('#addLessonForm2 select[name="parity_week"]').val();
		}
		if( $( '#addLessonForm2 input[name="notregular2"]' ).is( ':checked' ) ){
		    
		    var date_start = $('#addLessonForm2 .lesson-not-regular .date-start').val();
		    var date_end = $('#addLessonForm2 .lesson-not-regular .date-end').val();
		    if ( date_start == '__.__.____' ) { date_start = ''; }
		    if ( date_end == '__.__.____' ) { date_end = ''; }
		    var date_start_error = false, date_end_error = false;
		    
		    //проверка формата дат
		    if( date_start && !shedule.validateDate( date_start ) ){
			date_start_error = true;
		    }
		    if( date_end && !shedule.validateDate( date_end ) ){
			date_end_error = true;
		    }
		    
		    //проверка очередности дат
		    if ( date_start && date_end ) {
			if( shedule.dateToUnix(date_start) > shedule.dateToUnix(date_end) ){
			    date_start_error = true;
			    date_end_error = true;
			}
		    }
		    
		    $('.date-start,.date-end','#addLessonForm2 .lesson-not-regular').css('border-color','#bababa');
		    
		    if ( date_start_error || date_end_error ) {
			if( date_start_error ) $('.date-start','#addLessonForm2 .lesson-not-regular').css('border-color','#ff0000');
			if( date_end_error ) $('.date-end','#addLessonForm2 .lesson-not-regular').css('border-color','#ff0000');
			return false;
		    }
		    
		    if( date_start ) lesson.date_start = date_start;
		    if( date_end ) lesson.date_end = date_end;
		    
		} else if( $( '#addLessonForm2 input[name="notregular3"]' ).is( ':checked' ) ){
		    
		    var dates = shedule.validateMultiDates('#addLessonForm2 div.lesson-not-regular .dates');
		    
		    if ( dates.length == 0 ) {
			return false;
		    }else{
			lesson.dates = dates;
		    }
		}
		
	    }else{
		lesson.parity = 0;
	    }
	    
	    //Добавляем предмет в общий список, если его там ещё нет
	    var exists = false;
	    if ( $.inArray( lesson.subject, shedule.input_data.lessons ) == -1 ) {
		shedule.input_data.lessons.push( lesson.subject );
	    }
	    
	    //Добавляем аудиторию и преподавателя в общий список, если их там ещё нет
	    shedule.addDataInput( lesson.auditories, 'auditories', ['auditory_id', 'auditory_name', 'auditory_address'] );
	    shedule.addDataInput( lesson.teachers, 'teachers', ['teacher_id', 'teacher_name'] );
	    shedule.addDataInput( lesson.groups, 'groups', ['group_id', 'group_name'] );
	    
	}
	
	//console.log(lesson);
	
	//Сохраняем данные
	var data_index = shedule.getDataIndex( day_id );
	
	//обновляем
	if ( lesson_index !== null ) {
	    
	    shedule.data.lessons_days[ data_index ].lessons[ lesson_index ] = lesson;
	    
	}
	//добавляем
	else{
	    
	    if ( data_index > -1 ) {
		
		shedule.data.lessons_days[ data_index ].lessons.push( lesson );
		
	    }else{
		shedule.data.lessons_days.push( { weekday: day_id, lessons: [ lesson ] } );
	    }
	    
	    //обновяем перерыв и время окончания первой пары
	    var data_index = shedule.getDataIndex( day_id );
	    shedule.saveLessonInterval( data_index, shedule.data.lessons_days[ data_index ].lessons.length - 1 );
	    
	}
	
	shedule.sortLessons( data_index );//сортировка по времени
	
	//$('#addLessonForm2').remove();
	
	//Добавить ещё пару на это же время
	if( add_more ){
	    
	    shedule.formInit( null, day_id );
	    
	}else{
	    
	    shedule.updateTable( day_id );
	    
	}
	
	shedule.onDataChange();
	
	return false;
	
    },
    
    
    /**
     * Добавляем данные в общий список, если их там ещё нет
     *
     */
    addDataInput: function( data, data_key, data_fields ){
	
	for( var i in data ){
	    if ( !data.hasOwnProperty(i) ) { continue; }
	    
	    var add = false;
	    
	    if ( !data[i][data_fields[0]] ) {
		
		var add = true;
		
		for ( var ii in shedule.input_data[ data_key ] ) {
		    if ( !shedule.input_data[ data_key ].hasOwnProperty(i) ) { continue; }
		    
		    if ( shedule.input_data[ data_key ][ii][ data_fields[1] ] == data[i][data_fields[1]] ) {
			if ( data_fields.length >= 3 && shedule.input_data[ data_key ][ii][ data_fields[2] ] != data[i][data_fields[2]] ) {
			    continue;
			}
			add = false;
			break;
		    }
		    
		}
		
	    }
	    
	    if ( add ) {
		
		shedule.input_data[ data_key ].push( data[i] );
		
		shedule.sortingData( data_key );
		
	    }
	    
	}
	
    },
    
    
    /**
     * Заполняет данные для тегов
     *
     */
    getSelectedData: function( values, data_keys, data_fields ){
	
	if ( !values || values.length == 0 ) {
	    shedule.data[ data_keys[1] ] = [];
	    return;
	}
	
	var output = [];
	var tags = shedule.getTagsArray( data_keys[0], data_fields );
	
	//Заполняем полные данные
	for( var i in values ){
	    
	    if ( !values.hasOwnProperty( i ) ) { continue; }
	    
	    var index = $.inArray( values[i], tags );
	    
	    if ( index > -1 ) {
		
		var tmp = {};
		for( var ii in data_fields ){
		    if ( typeof shedule.input_data[ data_keys[0] ][index][data_fields[ii]] != 'undefined' && shedule.input_data[ data_keys[0] ][index][data_fields[ii]] !== null ) {
			tmp[ data_fields[ii] ] = shedule.input_data[ data_keys[0] ][index][data_fields[ii]];
		    }else{
			tmp[ data_fields[ii] ] = null;
		    }
		}
		output.push( tmp );
		
	    }else{
		
		var tmp = {};
		tmp[ data_fields[0] ] = 0;
		tmp[ data_fields[1] ] = values[i];
		if ( data_fields.length > 2 ) {
		    
		    //если есть доп. данные (напрмиер адрес аудитории), ищем уже сохраненные
		    var f_value = null;
		    if ( shedule.data[ data_keys[1] ].length > 0 ) {
			
			for( var ii in shedule.data[ data_keys[1] ] ){
			    if ( !shedule.data[ data_keys[1] ].hasOwnProperty(ii) ) { continue; }
			    
			    if ( shedule.data[ data_keys[1] ][ii][data_fields[1]] == values[i] ) {
				f_value = shedule.data[ data_keys[1] ][ii][data_fields[2]];
				break;
			    }
			    
			}
			
		    }
		    
		    tmp[ data_fields[2] ] = f_value;
		    
		}
		
		output.push( tmp );
		
	    }
	    
	}
	
	shedule.data[ data_keys[1] ] = output.length > 0 ? output : [];
	
    },
    
    
    /**
     * saveLessonInterval
     *
     */
    saveLessonInterval: function( data_index, lesson_index ){
	
	var time_start_first = shedule.data.lessons_days[ data_index ].lessons[ lesson_index ].time_start;
	var time_end_first = shedule.data.lessons_days[ data_index ].lessons[ lesson_index ].time_end;
	var minutes_length_lesson = shedule.timeToMinutes( time_end_first ) - shedule.timeToMinutes( time_start_first );
	
	if ( minutes_length_lesson > 0 ) {
	    shedule.options.minutes_length_lesson = minutes_length_lesson;
	}
	
	if( lesson_index > 0 ){
	    
	    var time_end_first = shedule.data.lessons_days[ data_index ].lessons[ lesson_index - 1 ].time_end;
	    var time_start_second = shedule.data.lessons_days[ data_index ].lessons[ lesson_index ].time_start;
	    var interval_lesson = shedule.timeToMinutes( time_start_second ) - shedule.timeToMinutes( time_end_first );
	    
	    if ( interval_lesson > 0 ) {
		shedule.options.interval_lesson = interval_lesson;
	    }
	    
	}
	
    },
    
    /**
     * removeLesson
     *
     */
    removeLesson: function( e ){
	
	var el = e.target;
	var is_edit = !$(el).closest( 'td' ).is( '.cell-lesson-empty' );
	var tr = $(el).closest( 'tr' );
	var day_id = tr.data( 'day' );
	var tr_index = tr.prevAll('tr[data-day="'+day_id+'"]').size();
	
	var data_index = shedule.getDataIndex( day_id );
	
	if ( data_index > -1 ) {
	    shedule.data.lessons_days[data_index].lessons.splice( tr_index, 1 );
	    if ( shedule.data.lessons_days[data_index].lessons.length == 0 ) {
		shedule.data.lessons_days.splice( data_index, 1 );
	    }
	}
	
	shedule.updateTable( day_id );
	shedule.onDataChange();
	
	return false;
    },
    
    onDataChange: function(){
	
	//console.log('onDataChange',shedule.data.lessons_days);
	
	$('#error_message').empty();
	
	if ( shedule.data.lessons_days.length == 0 ) {
	    $('#btn-new-shedule').hide();
	}else{
	    $('#btn-new-shedule').show();
	}
	
    },
    
    
    /**
     * updateTable
     *
     */
    updateTable: function( day_id ){
	
	if ( typeof day_id != 'undefined' ) {
	    
	    var data_index = shedule.getDataIndex( day_id );
	    
	    var trs = $('#sheduleTable tr[data-day="'+day_id+'"]');
	    if ( trs.size() > 1 ) trs.not(':first').remove();
	    
	    //заполняем таблицу данными
	    if ( data_index > -1 && shedule.data.lessons_days[data_index].lessons.length > 0 ) {
		
		var lessons = shedule.data.lessons_days[data_index].lessons;
		
		for( var i in lessons ){
		    if ( !lessons.hasOwnProperty( i ) ) continue;
		    
		    if ( i == 0 ) {
			
			var tr = $('#sheduleTable tr[data-day="'+day_id+'"]:last');
			var first_td = $( 'td:first', tr );
			
			if ( lessons.length > 1 ) {
			    first_td.prop( 'rowspan', lessons.length );
			}else{
			    first_td.removeAttr( 'rowspan' );
			}
			
			//время
			if ( first_td.next('td').size() == 0 ) first_td.after( '<td></td>' );
			var current_td = first_td.next('td');
			
			current_td
			.removeAttr('colspan')
			.attr( 'class', 'col-time table-time' );
			
			current_td.html( lessons[i].time_start + '-' + lessons[i].time_end );
			
			if ( lessons[i].type > -1 ) {
			    current_td.append( '<div class="change-day"><a href="#" class="js-link" data-opt="' + day_id + ',' + i + '">Изменить день недели</a></div>' );
			}
			
			//предмет
			if ( first_td.next('td').next('td').size() == 0 ) first_td.next('td').after( '<td></td>' );
			current_td = first_td.next('td').next('td');
			
		    }else{
			
			var append_html = '';
			if ( lessons[i].type > -1 ) {
			    append_html = ' <div class="change-day"><a href="#" class="js-link" data-opt="' + day_id + ',' + i + '" return false;">Изменить день недели</a></div>';
			}
			
			//время
			$('#sheduleTable tr[data-day="'+day_id+'"]:last')
			.after( '<tr class="lesson row-day" data-day="' + day_id + '"><td class="col-time table-time">' + lessons[i].time_start + '-' + lessons[i].time_end + append_html + '</td><td></td></tr>' );
			
			var tr = $('#sheduleTable tr[data-day="'+day_id+'"]:last');
			current_td = tr.find('td:last');
			
		    }
		    
		    current_td
		    .empty()
		    .removeAttr('colspan');
		    
		    //окно
		    if ( lessons[i].type == -1 ) {
			
			current_td.attr( 'class', 'col-group cell-lesson skip' );
			
			var html = '<div class="cell-lesson-cont">\
			    <div class="headline-lesson clear">\
				<div class="name-lesson">Окно</div>\
			    </div>\
			</div>';
			
			current_td.append( html );
			
		    }
		    //пара
		    else{
			
			current_td.attr( 'class', 'col-group cell-lesson' );
			
			var html = '<div class="cell-lesson-cont">\
			    <div class="headline-lesson clear">\
				<div class="type-lesson float-right"></div>\
				<div class="name-lesson"></div>\
			    </div>\
			</div>';
			
			current_td.append( html );
			var lesson_name = shedule.getLessonTypeName(lessons[i].type);
			
			$( '.type-lesson', current_td ).text( lesson_name );
			$( '.name-lesson', current_td ).text( lessons[i].subject );
			
			//преподаватель
			if( lessons[i].teachers ) {
			    
			    var teachers_arr = shedule.getNamesArr( lessons[i].teachers, 'teacher_name' );
			    if ( teachers_arr.length > 0 ) {
				$( '.cell-lesson-cont', current_td ).append( '<div class="teacher-lesson">' + teachers_arr.join(', ') + '</div>' );
			    }
			    
			}
			//группа
			if( lessons[i].groups ) {
			    
			    var groups_arr = shedule.getNamesArr( lessons[i].groups, 'group_name' );
			    if ( groups_arr.length > 0 ) {
				$( '.cell-lesson-cont', current_td ).append( '<div class="groups-lesson">' + groups_arr.join(', ') + '</div>' );
			    }
			    
			}
			//аудитория
			if ( lessons[i].auditories ) {
			    
			    var auditories_arr = shedule.getNamesArr( lessons[i].auditories, 'auditory_name' );
			    if ( auditories_arr.length > 0 ) {
				$( '.cell-lesson-cont', current_td ).append( '<div class="location-lesson">' + auditories_arr.join(', ') + '</div>' );
			    }
			    
			}
			
			var nextLesson;
			
			//даты
			//if( !lessons[i].parity !== 0 ){
			    
			    if( lessons[i].parity !== null && lessons[i].parity !== 0 ){
				
				$( '.cell-lesson-cont', current_td ).append( '<div style="margin-top: 4px;"><div class="float-right">&nbsp; <img src="' + shedule.options.imagesBaseUrl + 'image/' + lessons[i].parity + '.png"></div></div>' );
				
				if( typeof lessons[i+1] != 'undefined' ){
				    if( lessons[i].parity == 1 && lessons[i+1].parity == 2 && lessons[i].time_start == lessons[i+1].time_start && lessons[i].time_end == lessons[i+1].time_end ){
					nextLesson = 1;
				    }
				}
			    }
			    
			    var comment = '';
			    
			    if( lessons[i].dates && lessons[i].dates.length > 0 ){
				
				comment = '<div class="comment-lesson"><img src="' + shedule.options.imagesBaseUrl + 'image/mark.png" style="vertical-align: bottom; margin-right: 6px;">';
				comment += lessons[i].dates.join(', ');
				comment +='</div>';
				
			    }
			    else if( lessons[i].date_start || lessons[i].date_end ){
				
				comment += '<div class="comment-lesson"><img src="' + shedule.options.imagesBaseUrl + 'image/mark.png" style="vertical-align: bottom; margin-right: 6px;">';
				if( lessons[i].date_start ) comment += ' с ' + shedule.deleteYear(lessons[i].date_start);
				if( lessons[i].date_end ) comment += ' по ' + shedule.deleteYear(lessons[i].date_end);
				comment += '</div>';
				
			    }
			    $( '.cell-lesson-cont', current_td ).append( comment );
			    
			//}
			
		    }
		    
		    if(nextLesson == 1){
			
		    }else{
			
		    }
		    
		}
		
	    }
	    //обновляем пустую строку таблицы
	    else{
		
		var first_td = $('#sheduleTable tr[data-day="'+day_id+'"]:last').find('td:first');
		
		first_td.removeAttr( 'rowspan' );
		
		//время
		if ( first_td.next('td').size() == 0 ) first_td.after( '<td></td>' );
		var current_td = first_td.next('td');
		
		current_td
		.removeAttr('colspan')
		.attr( 'class', 'col-time table-time' )
		.text( '-' );
		
		//предмет
		if ( first_td.next('td').next('td').size() == 0 ) first_td.next('td').after( '<td></td>' );
		current_td = first_td.next('td').next('td');
		
		current_td
		.removeAttr('colspan')
		.attr( 'class', 'col-group cell-lesson-empty' )
		.html( '<div class="cell-lesson-cont"></div>' );
		
	    }
	    
	}
	//обновляем всю таблицу
	else{
	    
	    for( var i = 1; i <= 7; i++ ){
		shedule.updateTable( i );
	    }
	    
	}
	
    },
    
    
    /**
     * Изменение дня недели
     *
     */
    changeDayInit: function( e ){
	
	e.preventDefault();
	e.stopPropagation();
	var this_parent = $(e.target).parent('div');
	var opt = $(e.target).data('opt').split(',');
	var day_id = parseInt(opt[0]);
	var lesson_index = parseInt(opt[1]);
	var select_html = '<select>\
	<option value="1">Понедельник</option>\
	<option value="2">Вторник</option>\
	<option value="3">Среда</option>\
	<option value="4">Четверг</option>\
	<option value="5">Пятница</option>\
	<option value="6">Суббота</option>\
	<option value="7">Воскресенье</option>\
	</select>';
	
	if ( $('select',this_parent).size() == 0 ) {
	    
	    $(e.target).hide();
	    
	    this_parent.append( select_html );
	    
	    $('select',this_parent)
	    .val( day_id )
	    .bind( 'change', function(){
		
		var new_day = parseInt( $(this).val() );
		
		if ( new_day != day_id ) {
		    
		    shedule.changeDay( day_id, lesson_index, new_day );
		    
		    $(this).parent('div')
		    .find('a:first')
		    .show()
		    .next('select')
		    .remove();
		    
		}
		
	    });
	    
	}
	
	return false;
	
    },
    
    
    changeDay: function( day_id, lesson_index, new_day ){
	
	var data_index = shedule.getDataIndex( day_id );
	var new_data_index = shedule.getDataIndex( new_day );
	var lesson = $.extend( {}, shedule.data.lessons_days[data_index].lessons[lesson_index] );
	
	shedule.data.lessons_days[data_index].lessons.splice( lesson_index, 1 );
	shedule.sortLessons( data_index );
	shedule.updateTable( day_id );
	
	if( new_data_index > -1 ){
	    
	    shedule.data.lessons_days[new_data_index].lessons.push( lesson );
	    
	}else{
	    
	    shedule.data.lessons_days.push( { weekday: new_day, lessons: [ lesson ] } );
	    var new_data_index = shedule.data.lessons_days.length - 1;
	    
	}
	
	shedule.sortLessons( new_data_index );
	shedule.updateTable( new_day );
	
    },
    
    /**
     * Название типа предмета по его ID
     *
     */
    getLessonTypeName: function( type_id ){
	
	var output = '';
	
	for( var i in shedule.input_data.lessontypes ){
	    if ( shedule.input_data.lessontypes.hasOwnProperty(i) ) {
		if ( shedule.input_data.lessontypes[i].type == type_id ) {
		    output = shedule.input_data.lessontypes[i].typeName;
		    break;
		}
	    }
	}
	
	return output;
    },
    
    
    /**
     * Возвращает массив имен из массива объектов
     *
     */
    getNamesArr: function( arr, field_name ){
	
	var output_arr = [];
	if ( arr && arr.length > 0 ) {
	    for( var i in arr ){
		if ( arr.hasOwnProperty(i) ) {
		    if( arr[i][ field_name ] != 'Нет данных' ){
			output_arr.push( arr[i][ field_name ] );
		    }
		}
	    }
	}
	
	return output_arr;
	
    },
    
    urldecode: function( url ){
	return decodeURIComponent(url.replace(/\+/g, ' '));
    },
    
    /**
     * parseGetParams
     *
     */
    parseGetParams: function() {
	var $_GET = {};
	var __GET = window.location.search.substring(1).split("&");
	for(var i=0; i<__GET.length; i++) {
	   var getVar = __GET[i].split("=");
	   $_GET[getVar[0]] = typeof(getVar[1])=="undefined" ? "" : shedule.urldecode( getVar[1] );
	}
	return $_GET;
    },
    
    /**
     * timeToMinutes
     *
     */
    timeToMinutes: function( time ){
	
        var time_arr = time.split(':');
        var dur = 0;
        var t = [ 60, 1 ];//[ 3600, 60, 1 ];
        
        for( var i in time_arr ){
            dur += ( parseFloat( time_arr[i] ) * t[i] );
        }
        
        return dur;
        
    },
    
    /**
     * secondsToTime
     *
     */
    secondsToTime: function( in_seconds ){
        
        var time = '';
        in_seconds = parseFloat( in_seconds.toFixed(2) );
        
        var hours   = Math.floor(in_seconds / 3600);
        var minutes = Math.floor((in_seconds - (hours * 3600)) / 60);
        var seconds = in_seconds - (hours * 3600) - (minutes * 60);
        //seconds = Math.floor( seconds );
        seconds = seconds.toFixed(2);
        
        if (hours   < 10) {hours   = "0"+hours;}
        if (minutes < 10) {minutes = "0"+minutes;}
        if (seconds < 10) {seconds = "0"+seconds;}
        var time = hours+':'+minutes+':'+seconds;
        
        return time;
        
    }
    
};
