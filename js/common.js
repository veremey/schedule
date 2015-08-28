$(document).ready(function() {

	// $(document).on("click", function(){
	// 	$(".js-popup").hide();
	// });

	// function scrollFixedElements() {
	//     var scroll_left = $(this).scrollLeft();
	//     $(".fixed-element").css({
	//         left: -scroll_left
	//     });
	// }
	// scrollFixedElements();
	// $(window).scroll(function(){
	//     scrollFixedElements()
	// });
		// if($(document).scrollTop()) {
	 //            $(".main__img").removeClass('blur');
	 //    } else{
	 //    	$(".main__img").addClass('blur');
	 //    };




	 $('.window').windows({
        snapping: true,
        snapSpeed: 500,
        snapInterval: 800,
        onScroll: function(scrollPos){
            // scrollPos:Number
            // scrollPos: 1,
            // $('.main__img').addClass('blur');
        },
         onSnapComplete: function($el){
             // after window ($el) snaps into place
        //    	$('.main__img').addClass('blur')
        },
        onWindowEnter: function($el){
            // when new window ($el) enters viewport
            // $('.main__img').removeClass('blur');
        }
    });


	// $('.window:eq(1)').parents().find('.main__img').css({'blur':'5px', '-webkit-blur':'5px'});
	// } else{
	// 	$(this).parent().find('.main__img').addClass('blur');
	// };


	console.log($('body').html());
});