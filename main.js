const APP_ID = "bf72940f350d4adf951d7600d2ab52c1"
let TOKEN;
let CHANNEL;

const client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'});

let localVideoTrack;
let localMicTrack;
let remoteUsers = {};



async function startLocalPreview() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        let username = document.getElementById("username-input").value.trim() || "Me";

        let localVideoContainer = document.getElementById("local-video");
        localVideoContainer.innerHTML = ""; // Clear previous content

        // Create a wrapper to hold the video and overlay
        let videoWrapper = document.createElement("div");
        videoWrapper.className = "video-wrapper";

        // Create video element
        let localVideoElement = document.createElement("video");
        localVideoElement.id = "local-preview";
        localVideoElement.autoplay = true;
        localVideoElement.muted = true;
        localVideoElement.srcObject = localStream;

        // Create username label
        let nameTag = document.createElement("div");
        nameTag.id = "local-username"
        nameTag.textContent = username;

        // Append video and username overlay
        videoWrapper.appendChild(localVideoElement);
        videoWrapper.appendChild(nameTag);

        // Append wrapper to container
        localVideoContainer.appendChild(videoWrapper);

    } catch (error) {
        console.error("Error accessing webcam:", error);
    }
};




let joinAndDisplayLocalStream = async () => {
    let joinError = ''
    if (document.getElementById('username-input').value == '') {
        joinError = 'username';
    } else {
        try {
            TOKEN = document.getElementById('room-key-input').value.toString(); 
            console.log(TOKEN);
            CHANNEL = document.getElementById('channel-name-input').value.toString(); 
            console.log(CHANNEL);
            
            client.on('user-published', handleUserJoined);
            client.on('user-left', handleUserLeft);
            let uid = Math.floor(1000000000 + Math.random() * 9000000000).toString();
            let username = document.getElementById('username-input').value.toString();
            await client.join(APP_ID, CHANNEL, TOKEN, uid+username);

            // Convert the local preview tracks to AgoraRTC tracks
            localVideoTrack = await AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: localStream.getVideoTracks()[0] });
            localMicTrack = await AgoraRTC.createCustomAudioTrack({ mediaStreamTrack: localStream.getAudioTracks()[0] });

            // Publish the same video preview to Agora
            await client.publish([localMicTrack, localVideoTrack]);

            console.log("Local preview video & audio published to Agora.");

        } catch (error) {
            console.error("Error publishing to Agora:", error);

            joinError = 'publishing'
        }
    }
        
    return joinError
};





let handleUserJoined = async (user, mediaType) => {
    console.log(user.uid);

    let userid = user.uid.toString().slice(0,10);
    let username = user.uid.toString().slice(10);

    console.log(`User joined: ${userid}, Media Type: ${mediaType}`);

    remoteUsers[userid] = user;
    await client.subscribe(user, mediaType);
    console.log(`Subscribed to ${mediaType} from user: ${userid}`);

    // Check if video container already exists
    let player = document.getElementById(`user-container-${userid}`);
    if (!player) {
        player = document.createElement('div');
        player.id = `user-container-${userid}`;
        player.className = "stream-container remote-video";

        // Video Element
        let videoDiv = document.createElement('div');
        videoDiv.className = "remote-video";
        videoDiv.id = `user-${userid}`;
        
        // Username Label (Positioned Inside the Video)
        let nameTag = document.createElement("div");
        nameTag.className = "username-overlay";
        nameTag.id = `username-${userid}`;
        nameTag.textContent = username; // Placeholder, replace with actual username if available

        // Append elements properly
        player.appendChild(videoDiv);
        player.appendChild(nameTag);
        document.getElementById('video-streams').appendChild(player);
    }

    // show user joined toast
    let toastBootstrap = bootstrap.Toast.getOrCreateInstance(document.getElementById('userJoinedToast'));
    toastBootstrap.show()
    document.getElementById('emptyCallText').style.display = 'none';


    // Play Video
    if (mediaType === 'video') {
        console.log(`Playing video for user: ${userid}`);
        if (user.videoTrack) {
            user.videoTrack.play(`user-${userid}`);
        } else {
            console.warn(`User ${userid} has no video track.`);
        }
    }

    // Play Audio
    if (mediaType === "audio") {
        user.audioTrack.play();
    }

    // JavaScript Update to Enlarge Username when Video is Off

        let remoteVideo = document.getElementById(`user-${userid}`)
        let container = remoteVideo.closest('.stream-container');
        let usernameTag = container.querySelector('.username-overlay');

        function checkVideoState() {
            let isVideoActive = remoteVideo.children.length > 0;

            console.log(isVideoActive);

            if (!isVideoActive) {
                remoteVideo.style.display = 'none';
                usernameTag.classList.add('video-off');
            } else {
                remoteVideo.style.display = 'block';
                usernameTag.classList.remove('video-off');
            }
        }

        setInterval(checkVideoState, 1000); // Check every 2 seconds
    console.log('handleing user joined');
};



let handleUserLeft = async (user) => {
    console.log(`removing user: ${user.uid}`);

    let userid = user.uid.toString().slice(0,10);

    delete remoteUsers[userid];
    document.getElementById(`user-container-${userid}`).remove();
    if (Object.keys(remoteUsers).length == 0) {
        document.getElementById('emptyCallText').style.display = 'flex';
    }
}

let joinStream = async () => {
    // set button to loading status
    document.getElementById('joinButtonText').innerHTML = "Loading...";
    document.getElementById('joinButtonLoading').className = "spinner-border spinner-border-sm";
    document.getElementById('join-btn').disabled = true;

    try {
        let joinError = await joinAndDisplayLocalStream();
        let joinErrorElement = document.getElementById('joinErrorHelp');

        if (joinError == "publishing") {
            joinErrorElement.innerHTML = 'Incorrect room key or channel name.'
            joinErrorElement.style.display = "flex";
        } else if (joinError == 'username') {
            joinErrorElement.innerHTML = 'Username is blank.'
            joinErrorElement.style.display = 'flex'
        } else {
            joinErrorElement.style.display = "none";
            document.getElementById('lobby').style.display = 'none';
            document.getElementById('stream-controls').style.display = 'flex';
            document.getElementById('emptyCallText').style.display = 'flex';
        }
    } catch (error) {
        console.error("Error joining stream:", error);
    }

    // set button back to normal
    document.getElementById('joinButtonText').innerHTML = "Join";
    document.getElementById('joinButtonLoading').className = "spinner-border spinner-border-sm visually-hidden";
    document.getElementById('join-btn').disabled = false;
};

let leaveStreamAndRemoveLocalStream = async() => {
    await client.leave();
    document.getElementById('lobby').style.display = 'flex';
    document.getElementById('stream-controls').style.display = 'none';
    document.getElementById('video-streams').innerHTML = '';
    document.getElementById('emptyCallText').style.display = 'none';
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
document.getElementById('username-input').addEventListener('input', function (e) {
    document.getElementById('local-username').textContent = e.target.value;
})
