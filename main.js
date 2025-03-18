const APP_ID = "bf72940f350d4adf951d7600d2ab52c1"
const TOKEN = "007eJxTYOi681ea13+DwUtuvtjbN/dzrPm8nyVtXtMkO+GT3MIT7vYrMCSlmRtZmhikGZsapJgkpqRZmhqmmJsZGKQYJSaZGiUblu69md4QyMgwyYGVmZEBAkF8HobcxJKMktKS/KLMvHQGBgBA7yJc"
const CHANNEL = "mathtutoring"

const client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'})

let localTracks = []
let remoteUsers = {}

let joinAndDisplayLocalStream = async () => {
    

    client.on('user-published', handleUserJoined)
    await client.join(APP_ID, CHANNEL, TOKEN, null);

    let localVideoTrack = await AgoraRTC.createCameraVideoTrack();
    let localMicTrack = await AgoraRTC.createMicrophoneAudioTrack();
    localVideoTrack.play("local-video");

    await client.publish([localMicTrack, localVideoTrack]);

    console.log("Local video track published!");
};

let handleUserJoined = async (user, mediaType) => {
    remoteUsers[user.uid] = user;
    await client.subscribe(user, mediaType);

    let player = document.getElementById(`user-container-${user.uid}`);
    if (!player) {
        player = document.createElement('div');
        player.id = `user-container-${user.uid}`;
        player.className = "stream-container";
        player.innerHTML = `<div class="remote-video" id="user-${user.uid}"></div>`;
        document.getElementById('video-streams').appendChild(player);
    }
    if (user.videoTrack) {
        if (mediaType === 'video') {
            user.videoTrack.play(`user-${user.uid}`); // Corrected to ensure it's playing
        }
    } else {
        console.log('VIDEO TRACK DOSENT exists')
        console.log(user)
    }
        

    if (mediaType === "audio") {
        user.audioTrack.play();
    }
};

let joinStream = async () => {
    await joinAndDisplayLocalStream()
    document.getElementById('join-btn').style.display = 'none'
    document.getElementById('stream-controls').style.display = 'flex'
}

document.getElementById('join-btn').addEventListener('click', joinStream)
