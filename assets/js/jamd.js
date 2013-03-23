var jamd = (function(){
	var d = document;
	var ap = d.getElementById('ap');
	var bufferInterval;
	var currentVolume = ap.volume;
	var userPressedPlayed, muted = false;

	// Private functions
	var getNiceTime = function(timeSlice) {
		var time = timeSlice;
		var h, m, s = 0;

		//Minutes
		m = Math.floor(time/60);
		if(m < 10) { m = "0" + m; }

		//Seconds
		s = (time%60).toFixed(2);
		if(s < 10) { s = "0" + s;}
		if(s == 60) {s = "00"; }
		s = s.replace('.', ':');

		//Final output
		outputTime = m + ':' + s;
		return outputTime;
	}

	// Public functions
	return {
		init: function() {
			jamd.attachListeners();
			//Initialize track if metadata fails to load before 1 second;
			//setTimeout(function() { jamd.initTrack(); }, 1000);	
		},
		attachListeners: function() {
			$('#play').click(function() { jamd.togglePlayPause(); });
			$('#pause').click(function() { jamd.togglePlayPause(); });
			$('#seekForward').click(function() { jamd.seekForward(); }); 
			$('#seekBackward').click(function() { jamd.seekBackward(); }); 
			$('#nextTrack').click(function() { jamd.nextTrack(); }); 
			$('#previousTrack').click(function() { jamd.previousTrack(); }); 
			$('.volumeSlider').change(function(e) { jamd.volumeSet( $('.volumeSlider').val() / 100 ); });
			$('.trackProgress').change(function(e) { jamd.seek(e); })
			$('#ap').on('loadedmetadata', function() { jamd.initTrack(); });
			$('#ap').on('timeupdate', function() { jamd.updateTimer(); });
			$('#ap').on('ended', function() { jamd.trackEnded(); });
			$(d).on('keydown', function(e) { jamd.keyPress(e); });
		
		},
		initTrack: function() {
			//Display id3 or Name of file 
			if(jamdPL) {
				var obj =  jamdPL.getCurrentMeta();
				var string = String(obj.artist + " - " + obj.track);
				d.querySelector('#description').innerHTML = string;
			} else {
				var fileName = $('#ap').attr('src');
				d.querySelector('#description').innerHTML = decodeURIComponent(fileName);
			}
			d.querySelector('#duration').innerHTML = "/ " + getNiceTime(ap.duration);

			//Update track progress slider with max value
			var maxVal = (ap.duration * 100).toFixed(0);
			d.querySelector('.trackProgress').setAttribute('max', maxVal);

		},
		startBufferingMeter: function() {
			bufferInterval = setInterval(function() {
				jamd.updateBuffer();
			},500);
		},
		updateBuffer: function() {
			if(d.querySelector('#ap').getAttribute('src') != '') {
				var buffered, duration, bufferedProgess;
				buffered = ap.buffered.end(0);
				duration = ap.duration;
				bufferProgress = ( ( buffered / duration ) * 100 );
				d.querySelector('#buffer').style.width = bufferProgress + "%";
				if(bufferProgress == 100) {
					clearInterval(bufferInterval);
				}
			}
		},
		updateTimer: function() {
			d.querySelector('#time').innerHTML = getNiceTime(ap.currentTime);
			d.querySelector('.trackProgress').value = ap.currentTime * 100;
		},

		//Player Events
		togglePlayPause: function() {
			if(!userPressedPlayed) { 
				userPressedPlayed = true; 
				jamd.startBufferingMeter();
			}
			(ap.paused ? ap.play() : ap.pause() );
		},
		trackEnded:function() {
			if(jamdPL) {
				jamdPL.nextTrack();
			}
		},

		//Seek
		seek: function(e) {
			ap.currentTime = parseInt($('.trackProgress').val()) / 100; 
			jamd.updateTimer();
		},
		seekForward: function(i) {
			if(typeof i === 'number') {
				ap.currentTime += 60;
			} else {
				ap.currentTime += 5;
			}
			jamd.updateTimer();
		},
		seekBackward: function(i) {
			if(typeof i === 'number') {
				ap.currentTime -= 60;
			} else {
				ap.currentTime -= 5;
			}
			jamd.updateTimer();
		},
		// Volume
		volumeSet:function(inVolume) {
			ap.volume = Math.round(inVolume*100)/100;
			var volume = (ap.volume *100).toFixed(0);
			d.querySelector('.volumeSlider').value = volume;
			d.querySelector('#volumeLevel').innerHTML = 'Volume ' + volume + "%";
		},
		toggleMute: function() {
			if(!muted) {
				muted = true;
				currentVolume = ap.volume;
				jamd.volumeSet(0);
			} else {
				muted = false;
				jamd.volumeSet(currentVolume);
			}
		},

		// Keyboard events
		keyPress: function(e) {
			//console.log(e.which);
			switch(e.which) {
				case 32: //Spacebar
					jamd.togglePlayPause();
					break;
				case 37: //Left Arrow
					(e.shiftKey ? jamd.seekBackward(1) : jamd.seekBackward() );
					break;
				case 39: //Right Arrow
					(e.shiftKey ? jamd.seekForward(1) : jamd.seekForward() );
					break;
				case 189: //Minus					
					if(ap.volume > 0.05) { 
						var volume = ap.volume - 0.05; 
						jamd.volumeSet(volume);
					}
					break;
				case 187: //Plus
					if(ap.volume < 0.95) { 
						var volume = ap.volume + 0.05; 
						jamd.volumeSet(volume);
					}
					break;
				case 77: //Plus
					jamd.toggleMute();
					break;
				case 78: // n
				case 190:
					jamdPL.nextTrack();
					break;
				case 80:
				case 188: // n
					jamdPL.previousTrack();
					break;

			}
		}

	}
})();

$(document).ready(function() {
	jamd.init();
});