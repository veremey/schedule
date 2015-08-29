$(document).ready(function() {

	if($('.container__center').hasClass('dark__text')) {
		$('.main__img_wrap').removeClass('blur');
	} else{
		$('.main__img_wrap').addClass('blur');
	};

	$('.task').on('click', function() {
		$(this).siblings().removeClass('is_active');
		$(this).addClass('is_active');
	});


		if($('.form_1').hasClass('is_active')) {
			alert('ФОРМА 111111');
		};
		if($('.form_2').hasClass('is_active')) {
			alert('ФОРМА 22222222');
			// $('#form_2').siblings().fadeOut();
			// $('#form_2').fadeIn();
		};
		if($('.form_3').hasClass('is_active')) {
			prompt('ФОРМА 33333333');
			// $('#form_3').siblings().fadeOut();
			// $('#form_3').fadeIn();
		};




});