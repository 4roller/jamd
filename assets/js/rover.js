var roverJS = (function() {
	return {
		init: function() {
			//console.log('roverJS init');
		},
		go: function(text) {
			$('#over').html(text);
			$('#over').addClass('go');
			setTimeout(function(){
				$('#over').removeClass('go');
			},500);


		}
	}


})();

roverJS.init();