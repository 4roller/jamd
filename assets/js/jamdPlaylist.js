
var jamdPL = (function(){ 
	var d = document;
	var currentTrackIndex,pushTimeout, currentFiles;
	return {
		playlist: [],
		init: function() {
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
			$('#playlist').on('click', 'li', function(e){ jamdPL.selectThis(e); });
			// Listen for playlist Pushed event and select the first item in playlist.
			$(document).on('plPushed', function(e){ 
				jamdPL.sortPL();
				var firstPlaylistItem = document.querySelector('.c2p');
				//$(firstPlaylistItem).click();
			});
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
		// Reording Playlist items
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
			e.preventDefault();
			var dt = e.originalEvent.dataTransfer;  
			var possibleURL = dt.getData(dt.types[0]);

			if(possibleURL.length > 0) {
				var tempArr = [];
				var urlArr = possibleURL.split(/\n/);
				urlArr.forEach(function(obj) {
					var newObj = {
						"name" : obj,
						"type" : "audio/stream"
					};
					tempArr.push(newObj);	
				});
				currentFiles = tempArr;
				jamdPL.populatePlayListByURLs(currentFiles);
			} else {
				currentFiles = dt.files;	
				jamdPL.populatePlaylistByFiles(currentFiles);
			}
			
			$('.dropInstructions').removeClass('over');			
			return false;

			// Interesting way to do a forEach using (call);
			// [].forEach.call(dt.types, function (type) {});
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
				} else { // No ID3 Tag
					returnObj = {
						"title": null, 
						"artist": null,
						'fileObject': f
					}
					callbackFn(returnObj);
				}
			}
			r.readAsArrayBuffer(f);

		}, 
		populatePlayListByURLs: function(filelist) {
			for(var i = 0; i<filelist.length; i++) {
				var plObject = {
					"filename": filelist[i].name,
					"track": "unknown",
					"artist": "unknown",
					"url": filelist[i].name
				};
				jamdPL.push(plObject);
			}
		},
		populatePlaylistByFiles: function(filelist) {
			for(var i = 0; i<filelist.length; i++) {
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
		add2Dom : function(obj) {
			var li = document.createElement('li');
			
			if(obj.artist == 'null') { 
				li.innerHTML = obj.filename;
			} else {
				li.innerHTML = obj.artist + " - " + obj.track;		
			}
  		li.setAttribute('data-src', obj.url);
  		li.setAttribute('draggable', 'true');
  		li.className = 'c2p';
			document.querySelector('#playlist').appendChild(li);
		},
		push : function(obj) {
			jamdPL.playlist.push(obj);
			if(pushTimeout) {
				clearTimeout(pushTimeout);
			}
			if(jamdPL.playlist.length > 0 ) {
				pushTimeout = setTimeout(function(){
					var plPushed = new CustomEvent('plPushed');
					document.dispatchEvent(plPushed);
				},500); 
			}
		},
		sortPL: function() {
			var arr = [];
			var newPL = [];
			for(var i = 0; i < currentFiles.length; i++) {
				var j = jamdPL.playlist.length;
				while(j--) {
					if( jamdPL.playlist[j].filename === currentFiles[i].name ) {
						newPL.push( jamdPL.playlist[j] );
						jamdPL.add2Dom( jamdPL.playlist[j] );
						jamdPL.playlist.splice(j,1);
						break;
					}
				}
			}
			if(jamdPL.playlist.length != 0) { 
				arr = jamdPL.playlist;
				arr = arr.concat(newPL); 
			} else { arr = newPL; }
			jamdPL.playlist = arr;
		},
		selectThis: function(e) {
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
			console.log(jamdPL.playlist.length);
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