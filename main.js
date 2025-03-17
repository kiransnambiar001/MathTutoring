const APP_ID = "bf72940f350d4adf951d7600d2ab52c1"
const TOKEN = "007eJxTYHhq1rLG4mje1c3+RmKComdXHmI7/fbMBPt1599MCoqO/5qrwJCUZm5kaWKQZmxqkGKSmJJmaWqYYm5mYJBilJhkapRseLn4RnpDICPDNqt1LIwMEAjiszDkJmbmMTAAAMREIWE="
const CHANNEL = "main"

const client = Agora.createClient({mode:'rtc', codec:'vp8'})

let localTracks = []
let remoteUsers = {}

let joinAndDisplayLocalStream = async () => {

    let UID = await client.join(APP_ID, CHANNEL, TOKEN, null)

    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks()

    let player = `<div class="border border-primary rounded-2" id="user-container-${UID}>
                    <div class="video-player"id="user=${UID}></div>
                  </div>`
    
    document.getElementById('video-streams'),insertAdjacentHTML('beforeend', player)

    localTracks[1].play(`user=${UID}`)

    await client.publish([localTracks[0], localTracks[1]])
}

let joinStream = async () => {
    await joinAndDisplayLocalStream()
    document.getElementById('join-btn').style.display = 'none'
    document.getElementById('stream-controls').style.display = 'flex'
}

document.getElementById('join-btn').addEventListener('click', joinStream)