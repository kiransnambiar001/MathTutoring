const APP_ID = "bf72940f350d4adf951d7600d2ab52c1"
let TOKEN;
let CHANNEL;

const client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'});

let localVideoTrack;
let localMicTrack;
let remoteUsers = {};
let micMuted = false;
let cameraMuted = false;
let questions = [];
let questionIndex = 0;



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
    let uid;
    let username;
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
            uid = Math.floor(1000000000 + Math.random() * 9000000000).toString();
            username = document.getElementById('username-input').value.toString();
            await client.join(APP_ID, CHANNEL, TOKEN, uid+username);

            // Convert the local preview tracks to AgoraRTC tracks
            try {localVideoTrack = await AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: localStream.getVideoTracks()[0] });}
            catch {}
            localMicTrack = await AgoraRTC.createCustomAudioTrack({ mediaStreamTrack: localStream.getAudioTracks()[0] });

            // Publish the same video preview to Agora
            await client.publish([localMicTrack, localVideoTrack]);

            console.log("Local preview video & audio published to Agora.");

        } catch (error) {
            console.error("Error publishing to Agora:", error);

            joinError = 'publishing'
        }
    }
        
    return [joinError, uid+username]
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
    // let toastBootstrap = bootstrap.Toast.getOrCreateInstance(document.getElementById('top-right-toast'));
    // document.getElementById('top-right-toast-text').innerHTML = `User ${username}`
    // document.getElementById('top-right-toast-title').innerHTML = `User Joined`
    // toastBootstrap.show()
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
        let returnList = await joinAndDisplayLocalStream();
        let joinError = returnList[0]
        let userid = returnList[1]
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

            // Question Display
            let questionBackBtn = document.getElementById('questionDisplayBack');
            let questionNextBtn = document.getElementById('questionDisplayNext');
            document.getElementById('questionDisplay').innerHTML = 'Loading...';

            document.getElementById('questionDisplayContainer').style.display = 'flex';

            if (questionBackBtn.classList.contains('disabled') == false) {questionBackBtn.classList.add('disabled');}
            if (questionNextBtn.classList.contains('disabled') == false) {questionNextBtn.classList.add('disabled');}
            try {
                questions = await getQuestionList(document.getElementById('channel-name-input').value.toString())
                console.log(questions);
                questionIndex = 0
                document.getElementById('questionDisplay').innerHTML = questions[0]
                document.getElementById('questionDisplayNumber').innerHTML = `Question 1 of ${questions.length}`
                questionBackBtn.classList.add('disabled');

                questionNextBtn.classList.remove('disabled');
            }
            catch (error) {
                console.error("Error getting question list:", error);
                document.getElementById('questionDisplay').innerHTML = "No questions found.";
            }
            
            
            // Join Whiteboard
            let whiteboardUUID = await getWhiteboardUUID(document.getElementById('channel-name-input').value.toString())
            let whiteboardRoomToken = await getRoomToken(whiteboardUUID)

            console.log("Channel Name: " + document.getElementById('channel-name-input').value.toString())
            console.log("Whiteboard Room Token: " + whiteboardRoomToken)
            console.log("Whiteboard UUID: " + whiteboardUUID)
            joinWhiteboardRoom(userid, whiteboardUUID, whiteboardRoomToken)
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
    document.getElementById('whiteboardControls').style.display = 'none';
    document.getElementById('questionDisplayContainer').style.display = 'none';
}

let toggleMic = async () => {
    let micButton = document.getElementById('mic-btn');
    if (localMicTrack.muted) {
        await localMicTrack.setMuted(false);
        micButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-mic-fill" viewBox="0 0 16 16" style="color: white;">
            <path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0z"/>
            <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5"/>
          </svg>`;
        micButton.className = 'btn btn-secondary rounded-pill shadow';
    } else {
        await localMicTrack.setMuted(true)
        micButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-mic-mute-fill" viewBox="0 0 16 16" style="color:white;">
  <path d="M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4 4 0 0 0 12 8V7a.5.5 0 0 1 1 0zm-5 4c.818 0 1.578-.245 2.212-.667l.718.719a5 5 0 0 1-2.43.923V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 1 0v1a4 4 0 0 0 4 4m3-9v4.879L5.158 2.037A3.001 3.001 0 0 1 11 3"/>
  <path d="M9.486 10.607 5 6.12V8a3 3 0 0 0 4.486 2.607m-7.84-9.253 12 12 .708-.708-12-12z"/>
</svg>`;
        micButton.className = 'btn btn-danger rounded-pill shadow';
    }
}

let toggleCam = async (event) => {
    let camButton = document.getElementById('cam-btn');
    let localVideoElement = document.getElementById("local-preview");

    if (localVideoElement) {
        if (localVideoElement.style.display === "none") {
            localVideoElement.style.display = "block";
            camButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-camera-video-fill" viewBox="0 0 16 16" style="color: white;">
            <path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2z"/>
          </svg>`;
            camButton.className = 'btn btn-secondary rounded-pill shadow';
        } else {
            localVideoElement.style.display = "none";
            camButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-camera-video-off-fill" viewBox="0 0 16 16" style="color:white;">
  <path fill-rule="evenodd" d="M10.961 12.365a2 2 0 0 0 .522-1.103l3.11 1.382A1 1 0 0 0 16 11.731V4.269a1 1 0 0 0-1.406-.913l-3.111 1.382A2 2 0 0 0 9.5 3H4.272zm-10.114-9A2 2 0 0 0 0 5v6a2 2 0 0 0 2 2h5.728zm9.746 11.925-10-14 .814-.58 10 14z"/>
</svg>`;
            camButton.className = 'btn btn-danger rounded-pill shadow';
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
document.getElementById('questionDisplayBack').addEventListener('click', function () {
    questionIndex--;
    if (questionIndex < 1) {document.getElementById('questionDisplayBack').classList.add('disabled');}
    else if (questionIndex < (questions.length - 1)) {document.getElementById('questionDisplayNext').classList.remove('disabled');}
    document.getElementById('questionDisplay').innerHTML = questions[questionIndex]
    document.getElementById('questionDisplayNumber').innerHTML = `Question ${questionIndex + 1} of ${questions.length}`
})
document.getElementById('questionDisplayNext').addEventListener('click', function () {
    questionIndex++;
    if (questionIndex >= (questions.length-1)) {document.getElementById('questionDisplayNext').classList.add('disabled');}
    else if (questionIndex > 0) {document.getElementById('questionDisplayBack').classList.remove('disabled');}
    document.getElementById('questionDisplay').innerHTML = questions[questionIndex]
    document.getElementById('questionDisplayNumber').innerHTML = `Question ${questionIndex + 1} of ${questions.length}`
})

