
/**
 * shedule teacher
 *
 * @version 1.0
 */

var app_teacher = {
    
    options: {
        apiUrl: '/api/v1/'
    },
    
    /**
     * init
     *
     */
    init: function(){
        
        var get_data = shedule.parseGetParams();
	if( !get_data.city || !get_data.univer || !get_data.nameTeacher || !get_data.idTeacher ){
	    document.location.href = 'step1.html';
	}
        
	if ( get_data.nameTeacher ) {
	    $('#sheduleTable .table-name-teacher').text( get_data.nameTeacher );
	}
	
	shedule.getData( get_data.univer, 'lessons' );
        shedule.getData( get_data.univer, 'auditories' );
	
	/*
	shedule.getData( get_data.univer, 'university', function(){
	    
	    console.log( shedule.unixtimeToDate(shedule.input_data.university.startDate), shedule.unixtimeToDate(shedule.input_data.university.endDate) );
	    
	});
	*/
	
	/*
	shedule.getData( get_data.univer, 'groups', function(){
	    for( var i in shedule.input_data.groups ){
		if ( !shedule.input_data.groups.hasOwnProperty( i ) ) continue;
		
		shedule.input_data.groups[i].group_id = shedule.input_data.groups[i].id;
		shedule.input_data.groups[i].group_name = shedule.input_data.groups[i].title;
	    }
	});
	*/
	
        shedule.getData( null, 'lessontypes', function(){
	    for( var i in shedule.input_data.lessontypes ){
		if ( !shedule.input_data.lessontypes.hasOwnProperty( i ) ) continue;
		$('#addLessonForm select.lesson-type')
		.append( '<option value="' + shedule.input_data.lessontypes[i].type + '">' + shedule.input_data.lessontypes[i].typeName + '</option>' );
	    }
	});
        
        shedule.dateRangeInit( '#dates .date-start', '#dates .date-end' );
        
	//Запрос сохраненного расписания
        shedule.options.getLessonsBy = 'idTeacher';
        shedule.getSavedLessons();
        
        shedule.overlayOnOverInit();
	shedule.cleanSheduleInit();
	
	shedule.addPlaceInit();
        
        //Изменение дня недели
	$(document).on( 'click', '#sheduleTable .change-day a', shedule.changeDayInit );
        
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
                document.location.href = '/webform/step2_teacher.html' + query_str;
	    }else if ( $(this).val() == '2' ) {
		document.location.href = '/webform/step2_teacher_med.html' + query_str;
	    }
	});
	
	//Отправление расписания
	$('.sendJSON').bind( 'click', shedule.showDataWindow );
	
	//shedule.sendFormInit();
	
    }
    
}


