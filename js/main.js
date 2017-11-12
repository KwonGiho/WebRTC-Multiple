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
start();

function gotStream(stream) {
    trace('Received local stream');
    videos[0].srcObject = stream;
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
    setTimeout(()=>{call()}, 1000);
}

function call() {
    let video = document.querySelector('#video');
    let newVideo = undefined;
    for(let i=0;i<5;i++) {
        newVideo = document.createElement("video");
        videos.push(newVideo);
        video.appendChild(newVideo);
        pcLocals.push(new RTCPeerConnection());
        pcRemotes.push(new RTCPeerConnection());
    }
    callButton.disabled = true;
    hangupButton.disabled = false;


    pcRemotes.forEach( (v,i)=>
        v.onicecandidate = event =>
            handleCandidate(event.candidate, v, 'pc1: ', 'local')
    )
    pcLocals.forEach( (v,i)=>
        v.onicecandidate = event =>
            handleCandidate(event.candidate, pcRemotes[i], 'pc2: ', 'local')
    )


    // instead of ontrack = gotRemoteStream1 ,gotRemoteStream2
    pcRemotes.forEach( (v,i)=> v.ontrack = (e)=>{
            if (videos[i+1].srcObject !== e.streams[0])
                videos[i+1].srcObject = e.streams[0];
        }
    );

    window.localStream.getTracks().forEach(
        (track,i) =>
            pcLocals.forEach( (v,i)=>
                v.addTrack(
                    track,
                    window.localStream
                )
            )
    );

    pcLocals.forEach( (v,i) =>
        v.createOffer(
            offerOptions
        ).then(
            (desc)=>{
                v.setLocalDescription(desc);
                pcRemotes[i].setRemoteDescription(desc);
                pcRemotes[i].createAnswer().then(
                    (desc)=>{
                        pcRemotes[i].setLocalDescription(desc);

                        v.setRemoteDescription(desc);
                    },
                    onCreateSessionDescriptionError
                );
            },
            onCreateSessionDescriptionError
        )
    );
}

function onCreateSessionDescriptionError(error) {
    trace('Failed to create session description: ' + error.toString());
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