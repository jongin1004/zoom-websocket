const socket = io();

const myFace    = document.querySelector('#myFace');
const muteBtn   = document.querySelector('#muteBtn');
const cameraBtn = document.querySelector('#cameraBtn');

let myStream;
let muted     = false;
let cameraOff = false;

async function getMedia() {
    try {

        myStream = await navigator.mediaDevices.getUserMedia(
            {
                audio: true,
                video: true,
            }
        );

        myFace.srcObject = myStream;
    } catch (e) {
        console.error(e.message);
    }
}

getMedia();

const handleMuteBtnClick = () => {
    if ( ! muted) {
        muteBtn.innerHTML = 'Unmute';
    } else {
        muteBtn.innerHTML = 'Mute';
    }

    muted = ! muted;
}
const handleTurnCameraBtnClick = () => {
    if ( ! cameraOff) {
        cameraBtn.innerHTML = 'Turn Camera Off';    
    } else {
        cameraBtn.innerHTML = 'Turn Camera On';
    }

    cameraOff = ! cameraOff;
}

muteBtn.addEventListener('click', handleMuteBtnClick)
cameraBtn.addEventListener('click', handleTurnCameraBtnClick)