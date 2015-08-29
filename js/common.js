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

	function tab() {
		if($('.form_1').hasClass('is_active')) {
			$(this).siblings().fadeOut();
			$('#form_1').fadeIn();
		};
		if($('.form_2').hasClass('is_active')) {
			$(this).siblings().fadeOut();
			$('#form_2').fadeIn();
		};
		if($('.form_3').hasClass('is_active')) {
			$(this).siblings().fadeOut();
			$('#form_3').fadeIn();
		}
	}
	tab();




});