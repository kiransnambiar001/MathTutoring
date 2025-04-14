// Initialize Firebase
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDiKsmoHN41o9vAQTuyZrvUF8SRmh2zq4E",
    authDomain: "mathtutoring-67842.firebaseapp.com",
    projectId: "mathtutoring-67842",
    storageBucket: "mathtutoring-67842.firebasestorage.app",
    messagingSenderId: "283681300862",
    appId: "1:283681300862:web:b9fe625d808db6dfcb132f",
    measurementId: "G-LRFBPCRD1K"
};

firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

let fetchWhiteboardRoom = async () => {
    let whiteboardData;

    try {
        // Make the request and wait for the response
        const response = await fetch("https://api.netless.link/v5/rooms", {
            method: "POST",
            headers: {
                "token": "NETLESSSDK_YWs9NTdJaVRwVENRYm1aUlBGTyZub25jZT1jOWQ0Y2RjMC0xMGU0LTExZjAtOWFmYi00M2Q0MzY5NGU2MWImcm9sZT0wJnNpZz1mNDk2NDRkYTNmMGVkNjc5NzNlMTNlYzg5NTNhMTYzZDE5YjMxODdiNmYxOGZiMjExYWRiNDNiYTJhOGNiNTY3",
                "Content-Type": "application/json",
                "region": "us-sv"
            },
            body: JSON.stringify({
                isRecord: false
            })
        });

        // Wait for the response to be converted to JSON
        const data = await response.json();

        // Log the data and store it
        console.log("data here:");
        console.log(data);
        whiteboardData = data;
        
    } catch (error) {
        // Catch any errors that happen in the try block
        console.error("Error with creating whiteboard room:", error);
    }

    return whiteboardData
}

let createWhiteboardRoom = async (videoChannelName) => {
    let whiteboardData = await fetchWhiteboardRoom()

    let dbData = {
        whiteboardUuid: whiteboardData.uuid,
        callName: videoChannelName
    }

    await db.collection("rooms").doc(videoChannelName).set(dbData)
    .then(() => console.log("Document written successfully"))
    .catch((error) => console.error("Error writing document: ", error));

    return dbData.whiteboardUuid

}


let getWhiteboardUUID = async (videoChannelName) => {
    let data;

    try {
        const doc = await firebase.firestore().collection("rooms").doc(videoChannelName).get();
        if (doc.exists) {
            data = doc.data();
            console.log("Document data:", data);
        } else {
            console.log("No such document!");
            data = await createWhiteboardRoom(videoChannelName);
        }
    } catch (error) {
        console.error("Error getting document:", error);
    }

    return data.whiteboardUuid;
}

let getRoomToken = async (uuid) => {
    let roomToken;
    try {
        const response = await fetch(`https://api.netless.link/v5/tokens/rooms/${uuid}`, {
            method: "POST",
            headers: {
            "token": "NETLESSSDK_YWs9NTdJaVRwVENRYm1aUlBGTyZub25jZT1jOWQ0Y2RjMC0xMGU0LTExZjAtOWFmYi00M2Q0MzY5NGU2MWImcm9sZT0wJnNpZz1mNDk2NDRkYTNmMGVkNjc5NzNlMTNlYzg5NTNhMTYzZDE5YjMxODdiNmYxOGZiMjExYWRiNDNiYTJhOGNiNTY3", // Replace with your actual SDK token
            "Content-Type": "application/json",
            "region": "us-sv"
            },
            body: JSON.stringify({
            lifespan: 3600000,  // 1 hour in milliseconds
            role: "admin"       // or "writer"/"reader"
            })
        })

        roomToken = await response.json();
        console.log("Token created: "+roomToken);
    } catch (error) {
        console.log("Error: " + error);
    }
        
    return roomToken
}

let joinWhiteboardRoom = async (userid, uuid, roomToken) => {
    // Initialize the SDK
    var whiteWebSdk = new WhiteWebSdk({
        appIdentifier: "QuOdsAdlEfCMH5n9aKKKyw/MwqISrEmFhZQdg", // Replace with your actual App Identifier
        region: "us-sv" // Data center region
    });

    // Set the room joining parameters
    var joinRoomParams = {
        uuid: uuid,       // Replace with your room UUID
        uid: userid,              // Replace with a unique user ID
        roomToken: roomToken,  // Replace with a valid room token
        floatBar: true
    };

    let whiteboardElement = document.createElement('div');
    whiteboardElement.classList.add("rounded-4", "bg-light", "border", "border-1", "border-primary", "shadow");
    whiteboardElement.id = "whiteboard";
    document.getElementById("video-streams").appendChild(whiteboardElement);


  // Join the room and bind the whiteboard to an HTML element
  whiteWebSdk.joinRoom(joinRoomParams)
    .then(room => {
      room.bindHtmlElement(document.getElementById("whiteboard"));
      document.getElementById('whiteboard').style.display = 'flex';
      document.getElementById('whiteboardControls').style.display = 'flex';
      // Handle whiteboard controls
      let currentState = {
        currentApplianceName: "pencil",
        strokeColor: [0,0,0],
        strokeWidth: 5
      }

      room.setMemberState(currentState);

      // Stroke Color
      document.getElementById('whiteboardColorRed').addEventListener('change', function () {
          let red = Number(document.getElementById('whiteboardColorRed').value)
          currentState.strokeColor[0] = red
          room.setMemberState(currentState);
          document.getElementById('whiteboardStrokeColor').style.backgroundColor = `rgb(${red}, ${currentState.strokeColor[1]}, ${currentState.strokeColor[2]})`;
          console.log(currentState.strokeColor);
      })
      document.getElementById('whiteboardColorGreen').addEventListener('change', function () {
          let green = Number(document.getElementById('whiteboardColorGreen').value)
          currentState.strokeColor[1] = green
          room.setMemberState(currentState);
          document.getElementById('whiteboardStrokeColor').style.backgroundColor = `rgb(${currentState.strokeColor[0]}, ${green}, ${currentState.strokeColor[2]})`;
          console.log(currentState.strokeColor);
      })
      document.getElementById('whiteboardColorBlue').addEventListener('change', function () {
          let blue = Number(document.getElementById('whiteboardColorBlue').value)
          currentState.strokeColor[2] = blue
          room.setMemberState(currentState);
          document.getElementById('whiteboardStrokeColor').style.backgroundColor = `rgb(${currentState.strokeColor[0]}, ${currentState.strokeColor[1]}, ${blue})`;
          console.log(currentState.strokeColor);
      })

      // Stroke Width
      document.getElementById('whiteboardWidthInput').addEventListener('change', function () {
          let strokeWidth = Number(document.getElementById('whiteboardWidthInput').value)
          currentState.strokeWidth = strokeWidth;
          room.setMemberState(currentState);
          console.log(currentState.strokeWidth);
      })

      // Eraser
      document.getElementById('whiteboardEraser').addEventListener('click', function () {
          currentState.currentApplianceName = "eraser";
          room.setMemberState(currentState);
          console.log(currentState.currentApplianceName);
      })

      // Hand
      document.getElementById('whiteboardHand').addEventListener('click', function () {
          currentState.currentApplianceName = "hand";
          room.setMemberState(currentState);
          console.log(currentState.currentApplianceName);
      })

      // Laser
      document.getElementById('whiteboardLaser').addEventListener('click', function () {          
          currentState.currentApplianceName = "laserPointer";
          room.setMemberState(currentState);
          console.log(currentState.currentApplianceName);
      })

      // Pencil
      document.getElementById('whiteboardPencil').addEventListener('click', function () {
          currentState.currentApplianceName = "pencil";
          room.setMemberState(currentState);
          console.log(currentState.currentApplianceName);
      })

      // Rectangle
      document.getElementById('whiteboardRectangle').addEventListener('click', function () {
          currentState.currentApplianceName = "rectangle";
          room.setMemberState(currentState);
          console.log(currentState.currentApplianceName);
      })

      // Straight
      document.getElementById('whiteboardStraight').addEventListener('click', function () {
          currentState.currentApplianceName = "straight";
          room.setMemberState(currentState);
          console.log(currentState.currentApplianceName);
      })

      // Text
      document.getElementById('whiteboardText').addEventListener('click', function () {
          currentState.currentApplianceName = "text";
          room.setMemberState(currentState);
          console.log(currentState.currentApplianceName);
      })

      // Selector
      document.getElementById('whiteboardSelector').addEventListener('click', function () {
          currentState.currentApplianceName = "selector";
          room.setMemberState(currentState);
          console.log(currentState.currentApplianceName);
      })

    })
    .catch(error => {
      console.error("Failed to join room:", error);
      document.getElementById('whiteboard').remove()
    });
}

// Whiteboard Stroke Color
document.getElementById('whiteboardStrokeColor').addEventListener('click', function () {
    let displayStatus = document.getElementById('whiteboardColorDropdown').style.display
    if (displayStatus == 'none') {
        document.getElementById('whiteboardColorDropdown').style.display = 'flex'
    } else {
        document.getElementById('whiteboardColorDropdown').style.display = 'none'
    }
})

//Whiteboard Stroke Width
document.getElementById('whiteboardStrokeWidth').addEventListener('click', function () {
    let displayStatus = document.getElementById('whiteboardWidthDropdown').style.display
    if (displayStatus == 'none') {
        document.getElementById('whiteboardWidthDropdown').style.display = 'flex'
    } else {
        document.getElementById('whiteboardWidthDropdown').style.display = 'none'
    }
})

let getQuestionList = async (channel) => {
    let doc = await firebase.firestore().collection("rooms").doc(channel).get();
    let data = doc.data();
    
    return data.questions
}