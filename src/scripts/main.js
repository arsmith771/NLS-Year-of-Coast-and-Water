function showOverlay(){

	var overlay = jQuery('#video-overlay-1'),
		target1 = jQuery('#open-video-1');

	jQuery('#open-video-1').on('click', function(event){

		event.preventDefault();
		jQuery('#video-overlay-1')
		.css('display', 'flex')
	    .hide()
	    .fadeIn();

	});
}

function showOverlay2(){

	var overlay = jQuery('#audio-overlay-1'),
		target1 = jQuery('#open-audio-1');

	jQuery('#open-audio-1').on('click', function(event){

		event.preventDefault();
		jQuery('#audio-overlay-1')
		.css('display', 'flex')
	    .hide()
	    .fadeIn();

	});
}


function ctrlMedia(elem0, elem1){

	jQuery(document).on('click', elem0, function(){

		var media = document.getElementById( elem1 ); 

		if ( jQuery(elem0).hasClass('paused') ) {

			media.play();
			jQuery(elem0).addClass('playing');
			jQuery(elem0).removeClass('paused');

		} else {

			media.pause(); 
			jQuery(elem0).addClass('paused');
			jQuery(elem0).removeClass('playing');
		}
	})
	
}

function hideOverlay(){

	jQuery('body').on('click', '#close-overlay-1', function(){

		//event.preventDefault();
		jQuery('#video-overlay-1').fadeOut();
		document.getElementById('awa-tae-the-sea').pause();
		jQuery('#open-video-1').addClass('paused');
		jQuery('#open-video-1').removeClass('playing');

		console.log('paused');

	});

}

function hideOverlay2(){

	jQuery('body').on('click', '#close-overlay-2', function(){

		//event.preventDefault();
		jQuery('#audio-overlay-1').fadeOut();
		document.getElementById('archie-johnstone').pause();
		jQuery('#open-audio-1').addClass('paused');
		jQuery('#open-audio-1').removeClass('playing');

		console.log('paused');

	});

}

function tabMenu(){

	jQuery('.main-menu__item--has-sub').on('focus', function(){

		jQuery('.main-sub-menu').css('top','80px');
	});

	jQuery('.main-sub-menu__lnk:last').on('focus', function(){

		jQuery('.main-sub-menu').css('top','80px');
	});

	/*
	jQuery('.main-sub-menu__lnk:last').on('blur', function(){

		jQuery('.main-sub-menu').removeAttr('style');
	});
	*/
	jQuery('#xxx').on('focus', function(){

		jQuery('.main-sub-menu').removeAttr('style');
	});
	jQuery('#yyy').on('focus', function(){

		jQuery('.main-sub-menu').removeAttr('style');
	});
}

function toggleResponsiveMenu(){

	var menu = jQuery('#main-menu'),
		btn = jQuery('#main-nav__toggle');

	btn.on('click', function(){

		menu.slideToggle();
	});
}

function fixElem(){

	var scrollTop = jQuery(window).scrollTop();

	if ( scrollTop > 90 ){

		jQuery('#resultsSideBar').css('position','fixed').css('top','20px');

	} else {

		jQuery('#resultsSideBar').css('position','absolute').css('top','110px');

	}

	console.log( scrollTop );

}

function nowThen(){

	var now = jQuery('#slick-slide-control00'),
		then = jQuery('#slick-slide-control01');

	now.text('Now - Cockenzie 2019');
	then.text('Then - Cockenzie 1860');
}

function menuReset(){

	var winW = window.innerWidth;

	if (winW > 992) {

		jQuery('#main-menu').removeAttr('style');
	}
	
}

jQuery(document).ready(function(){

	showOverlay();
	showOverlay2();
	tabMenu();
	ctrlMedia('#open-video-1', 'awa-tae-the-sea');
	ctrlMedia('#open-audio-1', 'archie-johnstone');
	hideOverlay();
	hideOverlay2();
	toggleResponsiveMenu();
	nowThen();
	menuReset();
});

jQuery(window).on('scroll', function(){
	
	fixElem();
});

jQuery(window).on('resize', function(){

	menuReset();
});