const APP_ID = "bf72940f350d4adf951d7600d2ab52c1"
const TOKEN = "007eJxTYFhgOnHr3Gt35YI2v46W31Df/jCkIshTtZ/ncm8l37vC+6sVGJLSzI0sTQzSjE0NUkwSU9IsTQ1TzM0MDFKMEpNMjZIN69jupTcEMjLor7nIwAiFID4vQ0Z+QWpJRmZxeX5RdjEDAwDTZiQ5"
const CHANNEL = "hopethisworks"

const client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'});

let localVideoTrack;
let localMicTrack;
let remoteUsers = {};


let startLocalPreview = async () => {
    try {
        // Request access to webcam & microphone
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        // Get the local video element
        let localVideoElement = document.createElement("video");
        localVideoElement.id = "local-preview";
        localVideoElement.autoplay = true;
        localVideoElement.muted = true; // Prevent echo
        localVideoElement.srcObject = localStream;

        // Clear previous content and add the video
        let localVideoContainer = document.getElementById("local-video");
        localVideoContainer.innerHTML = "";
        localVideoContainer.appendChild(localVideoElement);

        console.log("Local video preview started.");

    } catch (error) {
        console.error("Error accessing webcam:", error);
    }
};

let joinAndDisplayLocalStream = async () => {
    try {
        client.on('user-published', handleUserJoined);
        client.on('user-left', handleUserLeft);
        let uid = await client.join(APP_ID, CHANNEL, TOKEN, null);

        // Convert the local preview tracks to AgoraRTC tracks
        localVideoTrack = await AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: localStream.getVideoTracks()[0] });
        localMicTrack = await AgoraRTC.createCustomAudioTrack({ mediaStreamTrack: localStream.getAudioTracks()[0] });

        // Publish the same video preview to Agora
        await client.publish([localMicTrack, localVideoTrack]);

        console.log("Local preview video & audio published to Agora.");

    } catch (error) {
        console.error("Error publishing to Agora:", error);
    }
};





let handleUserJoined = async (user, mediaType) => {
    console.log(`User joined: ${user.uid}, Media Type: ${mediaType}`);

    remoteUsers[user.uid] = user;
    await client.subscribe(user, mediaType);
    console.log(`Subscribed to ${mediaType} from user: ${user.uid}`);

    // Create a new remote video container
    let player = document.getElementById(`user-container-${user.uid}`);
    if (!player) {
        player = document.createElement('div');
        player.id = `user-container-${user.uid}`;
        player.className = "stream-container remote-video";
        player.innerHTML = `<div class="remote-video" id="user-${user.uid}"></div>`;
        document.getElementById('video-streams').appendChild(player);
    }

    if (mediaType === 'video') {
        console.log(`Playing video for user: ${user.uid}`);
        if (user.videoTrack) {
            user.videoTrack.play(`user-${user.uid}`);
        } else {
            console.warn(`User ${user.uid} has no video track.`);
        }
    }

    if (mediaType === "audio") {
        user.audioTrack.play();
    }
};

let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid];
    document.getElementById(`user-container-${user.uid}`).remove();
}

let joinStream = async () => {
    try {
        await joinAndDisplayLocalStream();
        
        document.getElementById('join-btn').style.display = 'none';
        document.getElementById('stream-controls').style.display = 'flex';

    } catch (error) {
        console.error("Error joining stream:", error);
    }
};

let leaveStreamAndRemoveLocalStream = async() => {
    await client.leave();
    document.getElementById('join-btn').style.display = 'block';
    document.getElementById('stream-controls').style.display = 'none';
    document.getElementById('video-streams').innerHTML = '';
}

let toggleMic = async (event) => {
    let micButton = event.target
    if (localMicTrack.muted) {
        await localMicTrack.setMuted(false);
        micButton.innerHTML = 'Mic On';
        micButton.className = 'btn btn-secondary';
    } else {
        await localMicTrack.setMuted(true)
        micButton.innerHTML = 'Mic Off';
        micButton.className = 'btn btn-danger';
    }
}

let toggleCam = async (event) => {
    let camButton = event.target;
    let localVideoElement = document.getElementById("local-preview");

    if (localVideoElement) {
        if (localVideoElement.style.display === "none") {
            localVideoElement.style.display = "block";
            camButton.innerHTML = 'Camera On';
            camButton.className = 'btn btn-secondary';
        } else {
            localVideoElement.style.display = "none";
            camButton.innerHTML = 'Camera Off';
            camButton.className = 'btn btn-danger';
        }
    }

    if (localVideoTrack) {
        let muted = localVideoTrack.muted;
        await localVideoTrack.setMuted(!muted);
    }
};


window.onload = startLocalPreview
document.getElementById('join-btn').addEventListener('click', joinStream);
document.getElementById('leave-btn').addEventListener('click', leaveStreamAndRemoveLocalStream);
document.getElementById('mic-btn').addEventListener('click', toggleMic);
document.getElementById('cam-btn').addEventListener('click', toggleCam);

