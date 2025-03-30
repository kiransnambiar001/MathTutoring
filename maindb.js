import { initializeApp } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-app.js";
import { getFirestore, doc } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDiKsmoHN41o9vAQTuyZrvUF8SRmh2zq4E",
    authDomain: "mathtutoring-67842.firebaseapp.com",
    projectId: "mathtutoring-67842",
    storageBucket: "mathtutoring-67842.firebasestorage.app",
    messagingSenderId: "283681300862",
    appId: "1:283681300862:web:b9fe625d808db6dfcb132f",
    measurementId: "G-LRFBPCRD1K"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let publishUsernameWithUID = async (userid, username) => {
    try {
        await setDoc(doc(db, "usernames", `/${userid}`), {
            name: username,
            uid: userid.toString()
        });
    } catch (error) {
        console.log(`Failed to add username data to firebase: ${error}`)
    }
}

