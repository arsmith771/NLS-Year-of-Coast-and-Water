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

jQuery(document).ready(function(){

	showOverlay();
	
	ctrlMedia('#open-video-1', 'awa-tae-the-sea');
	hideOverlay();

});