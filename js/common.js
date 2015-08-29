$(document).ready(function() {

	if($('.container__center').hasClass('dark__text')) {
		$('.main__img_wrap').removeClass('blur');
	} else{
		$('.main__img_wrap').addClass('blur');
	};

	$('.form_1').on('click', function() {
		$(this).siblings().removeClass('is_active');
		$(this).addClass('is_active');
		$('#form_1').siblings(":not(a)").fadeOut('fast');
		$('#form_1').fadeIn('fast');
	});
	$('.form_2').on('click', function() {
		$(this).siblings().removeClass('is_active');
		$(this).addClass('is_active');
		$('#form_2').siblings(":not(a)").fadeOut('fast');
		$('#form_2').fadeIn('fast');
	});
	$('.form_3').on('click', function() {
		$(this).siblings().removeClass('is_active');
		$(this).addClass('is_active');
		$('#form_3').siblings(":not(a)").fadeOut('fast');
		$('#form_3').fadeIn('fast');
	});

	if($('.form_1').hasClass('is_active')){
		$('#form_1').fadeIn('fast');
	};
	if($('.form_2').hasClass('is_active')){
		$('#form_2').fadeIn('fast');
	};
	if($('.form_3').hasClass('is_active')){
		$('#form_3').fadeIn('fast');
	};




});