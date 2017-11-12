/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

var startButton = document.getElementById('startButton');
var callButton = document.getElementById('callButton');
var hangupButton = document.getElementById('hangupButton');
callButton.disabled = true;
hangupButton.disabled = true;
startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;


var videos = [];


var pcLocals = [];
var pcRemotes = [];
var offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

function gotStream(stream) {
  trace('Received local stream');
  video1.srcObject = stream;
  window.localStream = stream;
  callButton.disabled = false;
}

function start() {
  videos.push(document.querySelector('video#video1'));
  trace('Requesting local stream');
  startButton.disabled = true;
  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  })
  .then(gotStream)
  .catch(function(e) {
    console.log('getUserMedia() error: ', e);
  });
}

function call() {
    videos.push(document.querySelector('video#video2'));
    videos.push(document.querySelector('video#video3'));
  callButton.disabled = true;
  hangupButton.disabled = false;
  trace('Starting calls');
  var audioTracks = window.localStream.getAudioTracks();
  var videoTracks = window.localStream.getVideoTracks();
  if (audioTracks.length > 0) {
    trace('Using audio device: ' + audioTracks[0].label);
  }
  if (videoTracks.length > 0) {
    trace('Using video device: ' + videoTracks[0].label);
  }
  // Create an RTCPeerConnection via the polyfill.
  var servers = null;
  pcLocals.push(new RTCPeerConnection(servers));
  pcRemotes.push(new RTCPeerConnection(servers));
  pcRemotes[0].ontrack = gotRemoteStream1;
  pcLocals[0].onicecandidate = iceCallback1Local;
  pcRemotes[0].onicecandidate = iceCallback1Remote;
  trace('pc1: created local and remote peer connection objects');

    pcLocals.push(new RTCPeerConnection(servers));
    pcRemotes.push(new RTCPeerConnection(servers));
    pcRemotes[1].ontrack = gotRemoteStream2;
    pcLocals[1].onicecandidate = iceCallback2Local;
    pcRemotes[1].onicecandidate = iceCallback2Remote;
  trace('pc2: created local and remote peer connection objects');

  window.localStream.getTracks().forEach(
    function(track) {
        pcLocals[0].addTrack(
        track,
        window.localStream
      );
    }
  );
  trace('Adding local stream to pc1Local');
    pcLocals[0].createOffer(
    offerOptions
  ).then(
    gotDescription1Local,
    onCreateSessionDescriptionError
  );

  window.localStream.getTracks().forEach(
    function(track) {
        pcLocals[1].addTrack(
        track,
        window.localStream
      );
    }
  );
  trace('Adding local stream to pc2Local');
    pcLocals[1].createOffer(
    offerOptions
  ).then(
    gotDescription2Local,
    onCreateSessionDescriptionError
  );
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

function gotDescription1Local(desc) {
    pcLocals[0].setLocalDescription(desc);
  trace('Offer from pc1Local \n' + desc.sdp);
    pcRemotes[0].setRemoteDescription(desc);
  // Since the 'remote' side has no media stream we need
  // to pass in the right constraints in order for it to
  // accept the incoming offer of audio and video.
    pcRemotes[0].createAnswer().then(
    gotDescription1Remote,
    onCreateSessionDescriptionError
  );
}

function gotDescription1Remote(desc) {
    pcRemotes[0].setLocalDescription(desc);
  trace('Answer from pc1Remote \n' + desc.sdp);
  pcLocals[0].setRemoteDescription(desc);
}

function gotDescription2Local(desc) {
  pcLocals[1].setLocalDescription(desc);
  trace('Offer from pc2Local \n' + desc.sdp);
  pcRemotes[1].setRemoteDescription(desc);
  // Since the 'remote' side has no media stream we need
  // to pass in the right constraints in order for it to
  // accept the incoming offer of audio and video.
  pcRemotes[1].createAnswer().then(
    gotDescription2Remote,
    onCreateSessionDescriptionError
  );
}

function gotDescription2Remote(desc) {
  pcRemotes[1].setLocalDescription(desc);
  trace('Answer from pc2Remote \n' + desc.sdp);
    pcLocals[1].setRemoteDescription(desc);
}

function hangup() {
  trace('Ending calls');
  pcLocals.forEach( (v,i)=> {
    v.close();
  });
  pcRemotes.forEach( (v,i)=> {
    v.close();
  });
    pcLocals.clean();
    pcRemotes.clean();

  hangupButton.disabled = true;
  callButton.disabled = false;
}

function gotRemoteStream1(e) {
  if (video2.srcObject !== e.streams[0]) {
    video2.srcObject = e.streams[0];
    trace('pc1: received remote stream');
  }
}

function gotRemoteStream2(e) {
  if (video3.srcObject !== e.streams[0]) {
    video3.srcObject = e.streams[0];
    trace('pc2: received remote stream');
  }
}

function iceCallback1Local(event) {
  handleCandidate(event.candidate, pcRemotes[0], 'pc1: ', 'local');
}

function iceCallback1Remote(event) {
  handleCandidate(event.candidate, pcLocals[0], 'pc1: ', 'remote');
}

function iceCallback2Local(event) {
  handleCandidate(event.candidate, pcRemotes[1], 'pc2: ', 'local');
}

function iceCallback2Remote(event) {
  handleCandidate(event.candidate, pcLocals[1], 'pc2: ', 'remote');
}

function handleCandidate(candidate, dest, prefix, type) {
  dest.addIceCandidate(candidate)
  .then(
    onAddIceCandidateSuccess,
    onAddIceCandidateError
  );
  trace(prefix + 'New ' + type + ' ICE candidate: ' +
      (candidate ? candidate.candidate : '(null)'));
}

function onAddIceCandidateSuccess() {
  trace('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
  trace('Failed to add ICE candidate: ' + error.toString());
}
