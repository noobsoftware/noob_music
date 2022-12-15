var browser_noob_music = {
	init: function() {
		$('#menu_show_navbar').on('command', function() {
			if($('#nav-bar').hasClass('nav_bar_hidden')) {
				$('#nav-bar').removeClass('nav_bar_hidden');
			} else {
				$('#nav-bar').addClass('nav_bar_hidden');
			}
		})
	}
}

setTimeout(function() {
	browser_noob_music.init();
}, 1000);