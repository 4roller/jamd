
var jamdPL = (function(){ 
	var d = document;
	var currentTrackIndex;
	return {
		playlist: [],
		init: function() {
			//console.log('playlist init');
			jamdPL.attatchListeners();
		},
		attatchListeners: function() {
			$('.dropInstructions').on('dragstart', function(e) { jamdPL.dragStart(e); });
			$('.dropInstructions').on('dragenter', function(e) { jamdPL.dragEnter(e); });
			$('.dropInstructions').on('dragover', function(e) { jamdPL.dragOver(e); });
			$('.dropInstructions').on('dragleave', function(e) { jamdPL.dragLeave(e); });
			$('.dropInstructions').on('drop', function(e) { jamdPL.dropFile(e); });
			
			$('#playlist').on('dragstart', 'li', function(e) { jamdPL.dragItemStart(e); });
			$('#playlist').on('dragenter', 'li', function(e) { jamdPL.dragEnter(e); });
			$('#playlist').on('dragover', 'li', function(e) { jamdPL.dragOver(e); });
			$('#playlist').on('dragleave', 'li', function(e) { jamdPL.dragLeave(e); });
			$('#playlist').on('drop','li' ,function(e) { jamdPL.dropItem(e); });
			
			$('#playlist').on('click', 'li', function(e){ jamdPL.playThis(e); });
		},


		dragItemStart: function(e) {
			var siblings = e.originalEvent.target.parentNode.childNodes;
			var el = e.target;
			//Strange way to find index of the item in a list without converting domElements to array
			var indexOfItem =  Array.prototype.indexOf.call(siblings, el); 
			el.style.opacity = '0.4';
			e.originalEvent.dataTransfer.setData('indexOfItem', indexOfItem);
			e.originalEvent.dataTransfer.dropEffect = 'move';
		},
		dropItem: function(e) {
			e.preventDefault();
			var parent = e.originalEvent.target.parentNode;
			var siblings = parent.childNodes;
			var el = e.target;
			var indexOfItem =  parseInt(e.originalEvent.dataTransfer.getData('indexOfItem'));
			var currentIndex = parseInt(Array.prototype.indexOf.call(siblings, el));
			parent.insertBefore(siblings[indexOfItem], siblings[currentIndex]);
			var item = jamdPL.playlist[indexOfItem];
			jamdPL.playlist.splice(currentIndex, 0, item);
			if(currentIndex > indexOfItem) {
				jamdPL.playlist.splice(indexOfItem, 1);
			} else {
				jamdPL.playlist.splice(indexOfItem+1, 1);
			}

			if(currentTrackIndex == indexOfItem) {
				currentTrackIndex = currentIndex-1;
			}

			var forEach = Array.prototype.forEach;
			forEach.call(siblings, function(item){
				item.style.opacity = 1;
			});

			//$(siblings).css('opacity',1);
			$(e.target).removeClass('over');
			return false;
		},




		// Drag and Drop event handlers 
		dragStart: function(e) {
			var el = e.target;
			$(el).css('opacity', '0.4');
			e.originalEvent.dataTransfer.dropEffect = 'move';
		},
		dragEnter: function(e) {
			$(e.target).addClass('over');
		},
		dragOver: function(e) {
			e.preventDefault();
			return false;
		},
		dragLeave: function(e) {
			$(e.target).removeClass('over');			
		},
		dropFile:function(e) {
			//console.log('drop');
			e.preventDefault();
			var dt = e.originalEvent.dataTransfer,  
			files = dt.files;
			jamdPL.populatePlaylist(files);
			$('.dropInstructions').removeClass('over');			
			return false;
		},
		getId3: function(f, callbackFn) {
			var r = new FileReader();

			r.onload = function(e) { 
				result = e.target.result
				var dv = new jDataView(result);
				
				if( dv.getString(3, dv.byteLength - 128) == "TAG") {
					returnObj = {
						"title": dv.getString(30, dv.tell()), 
						"artist": dv.getString(30, dv.tell()),
						'fileObject': f
					};
					callbackFn(returnObj);
				}
			}
			r.readAsArrayBuffer(f);

		}, 
		populatePlaylist: function(filelist) {
			var playlist = [];
			for(var i = filelist.length-1; i>=0; i--) {
			//for(var i = 0; i < filelist.length; i++) {
				jamdPL.getId3(filelist[i], function(obj) {
					var plObject = {
						"filename": String(obj.fileObject.name),
						"track": String(obj.title),
						"artist": String(obj.artist),
						"url": String(window.URL.createObjectURL(obj.fileObject))
					};
					jamdPL.push(plObject);
				});
			}
		},
		push : function(obj) {
			jamdPL.playlist.push(obj);
			
			var li = document.createElement('li');
			li.innerHTML = obj.artist + " - " + obj.track;
  			li.setAttribute('data-src', obj.url);

  			li.setAttribute('draggable', 'true');
  			li.className = 'c2p';
			document.querySelector('#playlist').appendChild(li);
		},
		playThis: function(e) {
			var src = $(e.target).attr('data-src');
			$('#ap').attr('src', src);
			currentTrackIndex = $('.c2p').index( $(e.target) );
			$('#playlist li').css('color', '#000').removeClass('playing');
			$(e.target).addClass('playing');
		},
		getCurrentTrackIndex: function() {
			return currentTrackIndex;
		},
		getCurrentMeta: function() {
			return jamdPL.playlist[currentTrackIndex];
		},
		previousTrack: function() {
			if(currentTrackIndex >= 1) {
				currentTrackIndex--;
				jamdPL.playTrack();
			}

		},
		nextTrack: function() {
			if(currentTrackIndex != jamdPL.playlist.length-1 ) {
				currentTrackIndex++;
				jamdPL.playTrack();				
			}
		},
		playTrack: function() {
				var src = jamdPL.playlist[currentTrackIndex].url;
				d.querySelector('#ap').setAttribute('src', src);
				var ap = d.getElementById('ap');
				ap.play();
				
				
				var items = d.querySelectorAll('#playlist li');

				for (var i = 0; i < items.length; i++) {
					items[i].classList.remove('playing'); 
				}
				


				var selector =  '#playlist li:nth-child(' + (parseInt(currentTrackIndex)+1) + ')';
				d.querySelector(selector).classList.add('playing');
		}


	}

})();

$(document).ready(function() {
	jamdPL.init();
});