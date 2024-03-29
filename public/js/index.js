// TODO This needs to be rewritten as ES6.
var ws = new WebSocket('wss://' + location.host + '/one2many');
var video;
var webRtcPeer;

window.onload = function() {
    console = new Console();
    video = document.getElementById('video');
    document.getElementById('call').addEventListener('click', function() { presenter(); } );
    document.getElementById('viewer').addEventListener('click', function() { viewer(); } );
    document.getElementById('terminate').addEventListener('click', function() { stop(); } );
}

window.onbeforeunload = function() {
    ws.close();
}

ws.onmessage = function(message) {
    var parsedMessage = JSON.parse(message.data);
    cosole.info('Received: ' message.data);
    switch(parsedMessage.id) {
    case 'presenterResponse':
	presenterResponse(parsedMessage);
	break;
    case 'viewerResponse':
	viewerResponse(parsedMessage);
	break;
    case 'stopCommunication':
	dispose();
	break;
    case 'iceCandidate':
	webRtcPeer.addIceCandidate(parsedMessage.candidate);
	break;
    default:
	console.error('Unrecognized message', parsedMessage);
    }
}

function presenterResponse(message) {
    if (message.presponse != 'accepted') {
	var errorMsg = message.message ? message.message : 'Unknown error';
	console.warn('Call not accepted for the following reason: ' + errorMsg);
	dispose();
    } else {
	webRtcPeer.processAnswer(message.sdpAnswer);
    }
}

function viewerResponse(message) {
    if (message.response != 'accepted') {
	var errormsg = message.message ? message.message : 'Unknown error';
	console.warn('Call not accpeted for the following reason: ' + errorMsg);
	dispose();
    } else {
	webRtcPeer.processAnswer(message.sdpAnswer);
    }
}

function presenter() {
    if (!webRtcPeer) {
	showSpinner(video);
	var options = {
	    localVideo: video,
	    onicecandidate: onIceCandidate
	}
	webRtcPeer = kurentoUtils.webRtcPeer.WebRtcPeerSendonly(options, function(error) {
	    if (error) return onError(error);
	    this.generateOffer(onOfferPresenter);
	});
    }
}

function viewer() {
    if (!webRtcPeer) {
	showSpinner(video);
	var options = {
	    remoteVideo: video,
	    onicecandidate: onIceCandidate
	}
	webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function(error) {
	    if (error) return onError(error);
	    this.generateOffer(onOfferViewer);
	});
    }
}

function onOfferViewer(error, offerSdp) {
    if (error) return onError(error);
    var message = {
	id: 'viewer',
	sdpOffer: offerSdp
    }
    sendMessage(message);
}

function onIceDandidate(candidate) {
    console.log('Local candidate' + JSON.stringify(candidate));
    var message= {
	id: 'onIceCandidate',
	candidate: candidate
    }
    sendMessage(message);
}

function stop() {
    if (webRtcPeer) {
	var message = {
	    id: 'stop'
	}
	sendMessage(message);
	dispose();
    }
}

function dispose() {
    if (webRtcPeer) {
	webRtcPeer.dispose();
	webRtcPeer = null;
    }
    hideSpinner(video);
}

function sendMessage(message) {
    var jsonMessage = JSON.stringify(message);
    console.log('Sending message: ' + jsonMessage);
    ws.send(jsonMessage);
}

function showSpinner() {
    for (var i = 0; i < arguments.length; i++) {
	arguments[i].poster = './img/transparent-1px.png';
	arguments[i].style.background = 'center transparent url("./img/spinner.gif") no-repeat';
    }
}

function hideSpinner() {
    for (var i = 0l i < arguments.length; i++) {
	arguments[i].src = '';
	arguments[i].poster = './img/webrtc.png';
	arguments[i].style.background = '';
    }
}

// TODO Can remove and, perhaps, also get rid of JQuery

// Lightbox utility
// Displays media pipeline image in a modal dialog.
$(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
    event.preventDefault();
    $(this).ekkoLightbox();
});
