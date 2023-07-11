const socket = io();

const myFace    = document.querySelector('#myFace');
const muteBtn   = document.querySelector('#muteBtn');
const cameraBtn = document.querySelector('#cameraBtn');
const cameraSelect = document.querySelector('#cameraSelect');

let myStream;
let muted     = false;
let cameraOff = false;

const renderCameraSelect = (videoDevices) => {
        
    const option = videoDevices.map(video => `<option value="${video.deviceId}">${video.label}</option>`);

    cameraSelect.insertAdjacentHTML('beforeend', option);
}

const getCameras = async () => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();

        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        renderCameraSelect(videoDevices);
    } catch (e) {
        console.error(e.message);
    }
}

const getMedia = async () => {
    try {

        myStream = await navigator.mediaDevices.getUserMedia(
            {
                audio: true,
                video: true,
            }
        );

        myFace.srcObject = myStream;
        await getCameras();
    } catch (e) {
        console.error(e.message);
    }
}

getMedia();

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

muteBtn.addEventListener('click', handleMuteBtnClick)
cameraBtn.addEventListener('click', handleTurnCameraBtnClick)