
/**
 * sheduleStart
 *
 * @version 1.5.2
 */


var sheduleStart = {
    
    input_data: { cities: [], universities: [], faculties: [], groups: [], teachers: [] },
    custom_values: { city: [], university: [], faculty: [], groups: [], teacher: [] },
    data: { city: {}, university: {}, faculty: {}, group: {}, teacher: {} },
    who: 'student',
    
    options: {
        apiUrl: '/api/v1/',
        data_names: {
            cities: ['город','города'],
            universities: ['ВУЗ','ВУЗа'],
            faculties: ['факультет','факультета'],
            groups: ['группу', 'группы'],
            teachers: ['преподавателя', 'преподавателя']
        },
        select2Opts: {
            //minimumInputLength: 3,
            allowClear: true,
            formatResult: function(item) { return item.title; },
            formatSelection: function(item) { return item.title; },
            matcher: function(term, text, option) {
                    return option.title.toUpperCase().indexOf( term.toUpperCase() ) >= 0;
            }
        }
    },
    
    /**
     * init
     *
     */
    init: function(){
	
        //города
        $.getJSON( sheduleStart.options.apiUrl + 'cities', function(cities){
            
            sheduleStart.input_data.cities = cities.data;
	    $('#search-city').select2( 'enable', true );
	    $('#search-city').data('select2').container.removeClass('loading');
            
        });
        
        //Город
        sheduleStart.searchSelectInit( '#search-city', 'cities', 'city', sheduleStart.universityGetData );
	
	$('#search-city').select2( 'enable', false );
	$('#search-city').data('select2').container.addClass('loading');
        
        //ВУЗ
        sheduleStart.searchSelectInit( '#search-vyz', 'universities', 'university', sheduleStart.facultyTeachersGetData );
        
        //факультет
        sheduleStart.searchSelectInit( '#search-fac', 'faculties', 'faculty', sheduleStart.groupsGetData );
        
        //группа
        sheduleStart.searchSelectInit( '#group_name', 'groups', 'group' );
        
        /*
        $('#wrapper-form input[name="shedule_type"]')
        .bind( 'click', function(){
            
            if ( $(this).val() == 2 ) {
                $('#dates').hide();
            }else{
                $('#dates').show();
            }
            
        });
        */
	
	//Переключение Студент / преподаватель
	$( '#wrapper-form input[name="who"]' )
	.bind('click',function(){
	    
	    if ( $(this).val() == '2' ) {
		
		$( '#wrapper-form div.student-fields' ).hide();
		$( '#wrapper-form div.teacher-fields' ).show();
		sheduleStart.who = 'teacher';
		
		if( !$('#search-teacher').data('select2') ){
		    sheduleStart.searchSelectInit( '#search-teacher', 'teachers', 'teacher' );
		}
		
		if ( !sheduleStart.input_data.teachers.length && sheduleStart.data.university.id ) {
		    sheduleStart.facultyTeachersGetData();
		}
		
	    }else{
		
		$( '#wrapper-form div.student-fields' ).show();
		$( '#wrapper-form div.teacher-fields' ).hide();
		sheduleStart.who = 'student';
		
		if ( !sheduleStart.input_data.faculties.length && sheduleStart.data.university.id ) {
		    sheduleStart.facultyTeachersGetData();
		}
		
	    }
	    
	});
        
        $('.modal-overlay,.modal .btn-cancel').bind( 'click', function(e){
		$('.modal-overlay').hide();
		$('.modal').hide();
                $('.modal input:text').val('');
		return false;
	    }
	);
        
        //Добавление нового значения по нажатию на Enter
        $(document).on( 'keyup', '#select2-drop .select2-input', function(e){
            
            var keyCode = e.keyCode || e.which;
            
            if( keyCode == 13 ){
                
                var sl2 = $(e.target).closest('#select2-drop').data('select2');
                var value = e.target.value;
                var target_el = sl2.opts.element;
                var data_key = target_el.data('data_key');
                
                var cur_data = sheduleStart.getDataByName( value, data_key );
                
                if ( cur_data === false ) {
                    
                    var msg_arr = sheduleStart.options.data_names[ data_key ];
                    sheduleStart.addValueWindow( '#' + target_el.attr('id'), msg_arr[0] );
                    
                }
                
            }
            
        });
        
        //действие на отправку формы добавления значения селектам
        $('#popup-add-value form').bind( 'submit', function(){
            $('#popup-add-value .btn-save').get(0).click();
            return false;
        });
        
    },
    
    
    /**
     * searchSelectInit
     *
     */
    searchSelectInit: function( el_selector, data_key, return_data_key, callback ){
        
        var msg_arr = sheduleStart.options.data_names[ data_key ];
	var data_keys = ['id','title'];
	if ( data_key == 'teachers' ) {
	    data_keys = ['teacher_id','teacher_name'];
	}
        
        $( el_selector )
        .data( 'data_key', data_key )
        .select2( $.extend( {}, sheduleStart.options.select2Opts, {
            
            placeholder: 'Выберите ' + msg_arr[0],
            allowClear: false,
	    closeOnSelect: true,
            formatNoMatches: function( term ){
                return 'добавить ' + msg_arr[0];
            },
            
            query: function (query) {
                
                var element = $(this)[0].element;
                var data = { results: [] };
                
                $.each( sheduleStart.input_data[ data_key ], function(){
                    if( query.term.length == 0 || this[data_keys[1]].toUpperCase().indexOf(query.term.toUpperCase()) >= 0 ){
                        data.results.push( { id: this[data_keys[0]], title: this[data_keys[1]] } );
                    }
                    else if ( query.term.length == 0 || ( this.shortTitle && this.shortTitle.toUpperCase().indexOf(query.term.toUpperCase()) >= 0 ) ) {
                        data.results.push( { id: this[data_keys[0]], title: this[data_keys[1]] } );
                    }
                });
                
                if( data.results.length <= 2 ){
                    
                    var tmp_name = '<a href="#" onclick="sheduleStart.addValueWindow(\'' + el_selector + '\',\'' + msg_arr[0] + '\'); return false;">добавить '+ msg_arr[0] + '</a>';
                    
                    data.results.push( { title: tmp_name } );
                    
                }
		
                //значение нашлось в списке
                //if ( data.results.length > 0 ) {
                    
                    query.callback( data );
                    
                //}
                /*
                если нужно добавить новое значение
                else{
                    
                    var new_text = $('#select2-drop .select2-input').val();
                    new_text = new_text.replace( /[\<\>"]/g, '' );
                    var new_value = [{ id: '0', title: new_text }];
                    if( new_value[0].title ){
                        
                        //results = [ { text: "university", children: new_value },{ title: '<a href="#" onclick="var sl2 = $(this).closest(\'#select2-drop\').data(\'select2\'); console.log(sl2); sl2.data({id:0,title:\''+new_value[0].title+'\'}); sl2.close(); sl2.trigger(\'change\');">добавить '+ msg_arr[0] + '</a>' } ],
                        results = [ { text: "university", children: new_value },{ title: '<a href="#" onclick="var sl2 = $(this).closest(\'#select2-drop\').data(\'select2\'); sl2.opts.element.select2( \'data\', {id:0,title:\''+new_value[0].title+'\'} ).trigger(\'change\');">добавить '+ msg_arr[0] + '</a>' } ],
                        query.callback({ results: results });
                        
                    }else{
                        query.callback( { results: [] } );
                    }
                    
                }
                */
            }
            
        }))
        .on("change", function(e) {
            
            var new_value = e.added || $(e.target).select2('data');
            $(e.target).select2('close');
            
            if( new_value ) sheduleStart.data[ return_data_key ] = new_value;
	    
            if ( typeof callback == 'function' ) {
                callback();
            }
            
            if( new_value && !parseInt( new_value.id ) ){
                
                if( $(e.target).attr('id') != 'group_name' ){
                    var message = '<span style="color:#e65049;">( ! )</span> ' + ( msg_arr[1].substr( msg_arr[1].length - 1, 1 ) == 'ы' ? 'Вашей ' : 'Вашего ' ) + msg_arr[1] + ' нет в нашей базе, поэтому модерация может занять несколько дней. Если вы не уверенны, что в нашей базе его нет, то рекомендуем попробовать еще раз.';
                    $('#formMessage').html(message);
                }
                
            }else{
                $('#formMessage').text('');
            }
            
            $(this).prev('.select2-container').find('.select2-choice').removeAttr('style');
            
            sheduleStart.facLinkInit();
            
        })
        .on("select2-open", function( e ) {
            
            var value = $(e.target).select2('data');
            
            if ( value && !parseInt(value.id) ) {
                
                $('.select2-drop:visible input.select2-input').val( value.title );
                
            }
            
        }).on("select2-close", function( e ){
            //$(e.target).trigger('change');
        });
        
    },
    
    
    /**
     * getValueId
     *
     */
    getDataByName: function( value, data_key ){
        
        var output = false;
	var data_keys = ['id','title'];
	if ( data_key == 'teachers' ) {
	    data_keys = ['teacher_id','teacher_name'];
	}
        
        for( var i in sheduleStart.input_data[ data_key ] ){
            if ( !sheduleStart.input_data[ data_key ].hasOwnProperty(i) ) continue;
            
            if( value.toLowerCase() == sheduleStart.input_data[ data_key ][i][data_keys[1]].toLowerCase() ){
                
                output = sheduleStart.input_data[ data_key ][i];
                
                break;
            }
            
        }
        
        return output;
        
    },
    
    
    /**
     * addValueWindow
     *
     */
    addValueWindow: function( el_selector, hdr_text ){
        
        var sl2 = $( el_selector ).data('select2');
        var target_el = sl2.opts.element;
        var data_key = target_el.data('data_key');
        var value = $('#select2-drop .select2-search .select2-input').val();
        $( el_selector ).select2( 'close' );
        $('#popup-add-value,.modal-overlay').show();
        $('#popup-add-value .headline-title-text').text( 'Добавить ' + hdr_text );
        
        $('#popup-add-value input[name="opt_value"]')
        .val( value )
        .get(0).focus();
        
        $('#popup-add-value .btn-save')
        .unbind('click')
        .click( 'click', function(){
            
            var value = $('#popup-add-value input[name="opt_value"]').val();
            value = $.trim(value);
            var data_id = 0;
            
            if ( !value ) {
                $('#popup-add-value input[name="opt_value"]').css('border-color','#ff0000');
                return false;
            }else{
                $('#popup-add-value input[name="opt_value"]').css('border-color','#bababa');
            }
            
            var cur_data = sheduleStart.getDataByName( value, data_key );
	    
            if ( cur_data !== false ) {
		
		if( el_selector == '#search-teacher' ){
		    
		    value = $.trim( cur_data.teacher_name );
		    data_id = cur_data.teacher_id;
		    
		}
		else{
		    
		    value = $.trim( cur_data.title );
		    data_id = cur_data.id;
		    
		}
            }
	    
	    var data = { id: data_id, title: value };
	    
	    if( el_selector == '#search-teacher' ){
		
		data.teacher_id = data_id;
		data.teacher_name =  value;
		
	    }
	    
            $( el_selector ).select2( 'data', data )
            .trigger('change');
            
            $('#popup-add-value,.modal-overlay').hide();
            
            return false;
            
        });
        
    },
    
    
    /**
     * facLinkinit
     *
     */
    facLinkInit: function(){
        
        if( sheduleStart.data.faculty && typeof sheduleStart.data.faculty.id !== 'undefined' && parseInt( sheduleStart.data.faculty.id ) === 0 ){
            $('#facLink').show();
        }else{
            $('#facLink').hide();
            $('#facLink input').val('');
        }
        
    },
    
    
    /**
     * universityGetData
     *
     */
    universityGetData: function(){
	
        sheduleStart.input_data.universities = [];
        
        if ( sheduleStart.data.city && parseInt( sheduleStart.data.city.id ) ){
            
            $('#search-vyz').select2( 'enable', false )
	    .data('select2').container.addClass('loading');
	    
            $.getJSON( sheduleStart.options.apiUrl + 'cities/' + sheduleStart.data.city.id + '/alluniversitiesSingleList', function( response ){				   
                
                if ( response.total && response.total > 0 ) {
                    
                    sheduleStart.input_data.universities = response.data;
                    
                }
		
                $('#search-vyz').select2( 'enable', true )
		.data('select2').container.removeClass('loading');
                
            });
            
        }
        
    },
    
    /**
     * facultyTeachersGetData
     *
     */
    facultyTeachersGetData: function(){
        
        sheduleStart.input_data.faculties = [];
        
        if (sheduleStart.data.university && parseInt( sheduleStart.data.university.id ) ){
	    
	    if ( sheduleStart.who == 'student' ) {
		var api_action = '/faculties/full';
		$('#search-fac').select2( 'enable', false )
		.data('select2').container.addClass('loading');
	    }else{
		var api_action = '/teachers';
		$('#search-teacher').select2( 'enable', false )
		.data('select2').container.addClass('loading');
	    }
	    
            $.getJSON( sheduleStart.options.apiUrl + 'universities/' + sheduleStart.data.university.id + api_action, function( response ){				   
		
                if ( response.total && response.total > 0 ) {
                    
                    sheduleStart.input_data[ ( sheduleStart.who == 'student' ? 'faculties' : 'teachers' ) ] = response.data;
                    
                }
		
                $( ( sheduleStart.who == 'student' ? '#search-fac' : '#search-teacher' ) )
		.select2( 'enable', true )
		.data('select2').container.removeClass('loading');
                
            });
            
        }
        
    },
    
    /**
     * groupsGetData
     *
     */
    groupsGetData: function(){
        
        sheduleStart.input_data.groups = [];
        
        if ( sheduleStart.data.faculty && parseInt( sheduleStart.data.faculty.id ) ){
            
            $('#group_name').select2( 'enable', false )
	    .data('select2').container.addClass('loading');
            
            $.getJSON( sheduleStart.options.apiUrl + 'faculties/' + sheduleStart.data.faculty.id + '/groups', function( response ){				   
                
                if ( response.total && response.total > 0 ) {
                    
                    sheduleStart.input_data.groups = response.data;
                    
                }
                
                $('#group_name').select2( 'enable', true )
		.data('select2').container.removeClass('loading');
                
            });
            
        }
        
    },
    
    /**
     * testDate
     *
     */
    testDate: function(date){
        var re = /^[0-3][0-9]\.[0|1][0-9]\.[2][0][0|1][0-9]$/;
        return re.test(date);
    },
    
    /**
     *  validateDate
     *
     */
    validateDate: function( date_str ){
        return /\d{2}\.\d{2}\.\d{4}/.test( date_str );
    },
    
    /**
     * dateRangeInit
     *
     */
    dateRangeInit: function( inputDateIn, inputDateOut ){
        
        var datetimepickerOpts = {
            lazyInit: false,
            datepicker: true,
            timepicker: false,
            formatDate: 'd.m.Y',
            formatTime: 'H:i',
            dayOfWeekStart: 1,
            allowBlank: true,
            validateOnBlur: false,
            closeOnDateSelect: true,
            closeOnWithoutClick: true,
            yearStart: new Date().getFullYear(),
            yearEnd: new Date().getFullYear() + 1,
            lang: 'ru',
            mask: true,
            format: 'd.m.Y',
            onClose: function( dp, $input ){
                
                if( !sheduleStart.validateDate( $input.val() ) ){
                    $input.css('border-color','#ff0000');
                }else{
                    $input.css('border-color','#bababa');
                }
                
            }
        };
        
        $( inputDateIn ).datetimepicker( $.extend( {}, datetimepickerOpts, {
                    onShow:function( ct ){
                        this.setOptions({
                            maxDate: sheduleStart.validateDate( $( inputDateOut ).val() ) ? $( inputDateOut ).val() : false
                        })
                    }
                }
            )
        )
        .bind( 'blur', function(){
            $( '.xdsoft_datetimepicker' ).hide();
        });
        
        $( inputDateOut ).datetimepicker( $.extend( {}, datetimepickerOpts, {
                    onShow:function( ct ){
                        this.setOptions({
                            minDate: sheduleStart.validateDate( $( inputDateIn ).val() ) ? $( inputDateIn ).val() : false
                        })
                    }
                }
            )
        )
        .bind( 'blur', function(){
            $( '.xdsoft_datetimepicker' ).hide();
        });
        
    },
    
    
    /**
     * step2LocationInit
     *
     */
    step2Location: function(){
	
	var f = 0;
	/*
	var shedule_type = $('#wrapper-form input[name="shedule_type"]:checked').val();
	
	if ( shedule_type == '1' ) {
	    
	    if($('.date-start').val() == ''){
		$('.date-start').css('border-color','#ff0000');
		f = 1;
	    } else {
		if( sheduleStart.testDate($('.date-start').val()) == false ) {
		    $('.date-start').css('border-color','#ff0000');
		    $('.date-start').parent().children('.popup-alert').css('display','block');
		    f = 1;
		} else {
		    $('.date-start').css('border-color','#bababa');
		    $('.date-start').parent().children('.popup-alert').css('display','none');
		}
	    }
	    
	    if($('.date-end').val() == ''){
		$('.date-end').css('border-color','#ff0000');
		f = 1;
	    } else {
		if( sheduleStart.testDate($('.date-end').val()) == false ) {
		    $('.date-end').css('border-color','#ff0000');
		    $('.date-end').parent().children('.popup-alert').css('display','block');
		    f = 1;
		} else {
		    $('.date-end').css('border-color','#bababa');
		    $('.date-end').parent().children('.popup-alert').css('display','none');
		}
	    }
	    
	    $('#dates-err').css('display','none');
	    if( f == 0 && $('.date-start').val() != '' && $('.date-end').val() != '' && ($.datepicker.parseDate( "dd.mm.yy", $('.date-start').val()) > $.datepicker.parseDate( "dd.mm.yy", $('.date-end').val())) ){
		$('.date-start').css('border-color','#ff0000');
		$('.date-end').css('border-color','#ff0000');
		$('#dates-err').css('display','block');
		f = 1;
	    }
	}
	*/
	
	//console.log( shedule_type, f );
	
	if( !sheduleStart.data.city.title ){
	    $('#search-city').prev('.select2-container').find('.select2-choice').css('border-color','#ff0000');
	    f = 1;
	} else {
	    $('#search-city').prev('.select2-container').find('.select2-choice').removeAttr('style');
	}
	if( !sheduleStart.data.university.title ){
	    $('#search-vyz').prev('.select2-container').find('.select2-choice').css('border-color','#ff0000');
	    f = 1;
	} else {
	    $('#search-vyz').prev('.select2-container').find('.select2-choice').removeAttr('style');
	}
	
	if ( sheduleStart.who == 'student' ) {
	    
	    if( !sheduleStart.data.faculty.title ){
		$('#search-fac').prev('.select2-container').find('.select2-choice').css('border-color','#ff0000');
		f = 1;
	    } else {
		$('#search-fac').prev('.select2-container').find('.select2-choice').removeAttr('style');
	    }
	    
	    if( !sheduleStart.data.group.title ){
		$('#group_name').prev('.select2-container').find('.select2-choice').css('border-color','#ff0000');
		f = 1;
	    } else {
		$('#group_name').prev('.select2-container').find('.select2-choice').removeAttr('style');
	    }
	    
	}
	
	else if (  sheduleStart.who == 'teacher' ) {
	    
	    if( !sheduleStart.data.teacher.title ){
		$('#search-teacher').prev('.select2-container').find('.select2-choice').css('border-color','#ff0000');
		f = 1;
	    } else {
		$('#search-teacher').prev('.select2-container').find('.select2-choice').removeAttr('style');
	    }
	    
	}
	
	if(f == 1){
	    return false;
	}
	
	if ( sheduleStart.who == 'student' ) {
	    
	    var loc_href = '/webform/step2.html';
	    loc_href += '?idFac=' + sheduleStart.data.faculty.id;
	    loc_href += '&fac=' + sheduleStart.data.faculty.title;
	    loc_href += '&nameGroup=' + sheduleStart.data.group.title;
	    loc_href += '&idGroup=' + sheduleStart.data.group.id;
	    
	    if ( $('#facLink input').val() ) {
		var facLink = encodeURIComponent( $('#facLink input').val() );
		loc_href += '&facLink=' + facLink;
	    }
	    
	}
	
	else if ( sheduleStart.who == 'teacher' ) {
	    
	    var loc_href = '/webform/step2_teacher.html';
	    loc_href += '?nameTeacher=' + sheduleStart.data.teacher.title;
	    loc_href += '&idTeacher=' + sheduleStart.data.teacher.id;
	    
	}
	
	loc_href += '&city=' + sheduleStart.data.city.id;
	loc_href += '&nameCity=' + sheduleStart.data.city.title;
	loc_href += '&univer=' + sheduleStart.data.university.id;
	loc_href += '&nameUniver=' + sheduleStart.data.university.title;
	
	window.location.href = loc_href;
	
	return false;
	
    }
    
    
};

$('document').ready(function(){
    
    sheduleStart.init();
    
    $('input').bind('textchange', function(event, previousText){
        if($(this).val() == ''){
            $(this).css('border-color','#ff0000');
        } else {
            $(this).css('border-color','#bababa');
        }
    });
    
    //sheduleStart.dateRangeInit( '#wrapper-form .date-start', '#wrapper-form .date-end' );
    
    $(document).on('focus', '.form-text', function(){
        $(this).css('font-style', 'normal');
    });
    
    $('.step2').click( sheduleStart.step2Location );
    
});
