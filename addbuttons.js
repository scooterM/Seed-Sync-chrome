chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.visible) {
		addPushButtons();
	} else {
		removePushButtons();
	}
});

addPushButtons();

function addPushButtons() {
	var anchors = document.links;

	for (var i = 0; i < anchors.length; i++) {
		var anchor = anchors[i];

		// supports direct link to torrents (works for IPT)
		var direct = anchor.href.match(/.*\.torrent/);

		// supports BTN-style links
		var btn = anchor.href.match(/.*torrents\.php.*action=download.*/);
		if (direct || btn) {
			addButton(anchor);
		}
	}
}

function removePushButtons() {
	var buttons = document.getElementsByTagName('button');

	for (var i = buttons.length - 1; i >= 0; i--) {
		var button = buttons[i];
		if (button.getAttribute('seed-sync-push')) {
			button.parentNode.removeChild(button);
		}
	} 
}

function addButton(anchor) {
	var downloadButton = document.createElement('button');
	downloadButton.onclick = downloadOnClick(anchor.href);
	downloadButton.appendChild(document.createTextNode('Push'));
	downloadButton.setAttribute('seed-sync-push', true);
	anchor.parentNode.insertBefore(downloadButton, anchor.nextSibling);
}

function downloadOnClick(href) {
	return function() {
		loadTorrent(href);
	};
}

function loadTorrent(href) {
	// download the torrent
	var downloadReq = new XMLHttpRequest();
	downloadReq.open('GET', href, true);
	downloadReq.setRequestHeader('Accept', 'application/x-bittorrent');
	downloadReq.responseType = "arraybuffer";

	downloadReq.onload = function(e) {
		if (downloadReq.readyState === 4) {
			console.log(downloadReq.status);
			if (downloadReq.status === 200) {
				console.log(downloadReq.response);
				
				// determine the filename; prefer a content-disposition header if available
				var name;
				var disposition = this.getResponseHeader('content-disposition');
				var match = /attachment;.*?filename=\"(.*)\"/i.exec(disposition);
				if (match != null) {
					name = match[1];
				} else {
					name = getName(href);
				}
				uploadTorrent(name, downloadReq.response);
			}
		}
	};

	downloadReq.send(null);
}

function uploadTorrent(name, torrent) {
	var blob = new Blob([torrent], {type: 'application/x-bittorrent'});

	var formData = new FormData();
	formData.append('file', blob, name);

	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'http://oauthtest.geico.net:9876/seedsync/api/torrents/add', true);
	xhr.onload = function(e) {
		if (this.status === 200) {
			console.log('Request complete: ' + name);
		}
	};

	xhr.send(formData);
}

function getName(path) {
	return path.replace(/^.*[\\\/]/, '')
}
