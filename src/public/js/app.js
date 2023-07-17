const socket = io();

const myFace    = document.querySelector('#myFace');
const muteBtn   = document.querySelector('#muteBtn');
const cameraBtn = document.querySelector('#cameraBtn');
const cameraSelect = document.querySelector('#cameraSelect');

const callDiv    = document.querySelector('#call');
const welcomeDiv = document.querySelector('#welcome');

callDiv.hidden = true;

let myPeerConnection;
let myStream;
let muted     = false;
let cameraOff = false;
let roomName;

const renderCameraSelect = (videoDevices) => {
        
    const option = videoDevices.map(video => `<option value="${video.deviceId}">${video.label}</option>`);

    cameraSelect.insertAdjacentHTML('beforeend', option);
}

const getCameras = async () => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        const currentCamera = myStream.getVideoTracks()[0];
        renderCameraSelect(videoDevices);

        const test = videoDevices.filter(camera => camera.label === currentCamera.label)[0];
        cameraSelect.value = test.deviceId;
    } catch (e) {
        console.error(e.message);
    }
}

const getMedia = async (deviceId) => {
    
    const initConstrains = {
        audio: true,
        video: { facingMode: "user" },
    };

    const cameraConstrains = {
        audio: true,
        video: { deviceId: { exact: deviceId } },
    };
    
    try {

        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstrains : initConstrains
        );

        myFace.srcObject = myStream;

        if (!deviceId) await getCameras();
        
    } catch (e) {
        console.error(e.message);
    }
}

const handleMuteBtnClick = () => {        

    myStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);

    if ( ! muted) {
        muteBtn.innerHTML = 'Unmute';
    } else {
        muteBtn.innerHTML = 'Mute';
    }

    muted = ! muted;
}
const handleTurnCameraBtnClick = () => {    

    myStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);

    if ( ! cameraOff) {
        cameraBtn.innerHTML = 'Turn Camera Off';    
    } else {
        cameraBtn.innerHTML = 'Turn Camera On';
    }    

    cameraOff = ! cameraOff;
}

const handleCameraChange = async (e) => {
    await getMedia(e.target.value);
    if(myPeerConnection) {
        const videoTrack  = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection.getSenders().find(sender => sender.track.kind === 'video');
        videoSender.replaceTrack(videoTrack);
    }
}

muteBtn.addEventListener('click', handleMuteBtnClick)
cameraBtn.addEventListener('click', handleTurnCameraBtnClick)
cameraSelect.addEventListener('input', handleCameraChange);


welcomeForm = welcomeDiv.querySelector('form');

const initCall = async () => {
    
    welcomeDiv.hidden = true;
    callDiv.hidden    = false;

    await getMedia();
    makeConnection();
}

const handleWelcomeSubmit = async (e) => {

    e.preventDefault();
    const input = welcomeForm.querySelector('input');
    await initCall();
    socket.emit('enter_room', input.value);
    roomName    = input.value;
    input.value = '';
}

welcomeForm.addEventListener('submit', handleWelcomeSubmit);

socket.on('welcome',async () => {   
    console.log('someone enter in this room');
    const offer = await myPeerConnection.createOffer();
    await myPeerConnection.setLocalDescription(offer);
    console.log('sent the offer'); 
    socket.emit('offer', offer, roomName);
});

socket.on('offer', async (offer) => {    
    console.log('received the offer'); 
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    await myPeerConnection.setLocalDescription(answer);  
    console.log('sent the answer'); 
    socket.emit('answer', answer, roomName);
});

socket.on('answer', async (answer) => {    
    console.log('received the answer');
    await myPeerConnection.setRemoteDescription(answer);
});

socket.on('ice', (ice) => {
    console.log('received the iceCandidate');
    myPeerConnection.addIceCandidate(ice);
});

// RTC Code
const handleIce = (data) => {
    console.log('sent the iceCandidate');
    socket.emit('ice', data.candidate, roomName);
}

const handleAddStream = (data) => {
    const peerFace     = document.querySelector('#peerFace')
    peerFace.srcObject = data.stream;
    console.log('got an event from my peer');
    console.log(data);
}
const makeConnection = () => {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302",
                ]
            }
        ]
    });    
    myPeerConnection.addEventListener('icecandidate', handleIce);
    myPeerConnection.addEventListener('addstream', handleAddStream)
    myStream.getTracks().forEach(track => myPeerConnection.addTrack(track, myStream));    
}