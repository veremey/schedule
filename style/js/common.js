$(document).ready(function() {

	if($('.container__center').hasClass('dark__text')) {
		$('.main__img_wrap').removeClass('blur');
	} else{
		$('.main__img_wrap').addClass('blur');
	};

	$('.form_1').on('click', function() {
		$(this).siblings().removeClass('is_active');
		$(this).addClass('is_active');
		$('#form_1').siblings().removeClass('is_active');
		$('#form_1').addClass('is_active');
		return false;
	});
	$('.form_2').on('click', function() {
		$(this).siblings().removeClass('is_active');
		$(this).addClass('is_active');
		$('#form_2').siblings(":not(a)").removeClass('is_active');
		$('#form_2').addClass('is_active');
		return false;
	});
	$('.form_3').on('click', function() {
		$(this).siblings().removeClass('is_active');
		$(this).addClass('is_active');
		$('#form_3').siblings(":not(a)").removeClass('is_active');
		$('#form_3').addClass('is_active');
		return false;
	});

	if($('.form_1').hasClass('is_active')){
		$('#form_1').addClass('is_active');
	};
	if($('.form_2').hasClass('is_active')){
		$('#form_2').addClass('is_active');
	};
	if($('.form_3').hasClass('is_active')){
		$('#form_3').addClass('is_active');
	};

	//slider
	if($(document).width() < 768){
		$('.task__wrap').slick({
			dots: true,
			infinite: true,
			speed: 900,
			slidesToShow: 1,
			slidesToScroll: 1,
			adaptiveHeight: true
		});

		$('.task').removeClass('is_active');

		$('.main__img_wrap').prepend('<div class="main__img"></div>');
	}; //768



	$('.btn__hiden-767').on('click',function() {
		$('.header').toggleClass('header_100');
		$('.header__menu li:not(.is_active), .socio').toggleClass('is_act');
	});

});