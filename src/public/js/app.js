const socket = io();

const myFace       = document.querySelector('#myFace');        // 내 video element
const peerFace     = document.querySelector('#peerFace');      // 상대 video element
const shareFace     = document.querySelector('#shareFace');      // 상대 video element
const muteBtn      = document.querySelector('#muteBtn');       // 오디오 on/off 버튼
const cameraBtn    = document.querySelector('#cameraBtn');     // 카메라 on/off 버튼
const stopBtn      = document.querySelector('#stopBtn');     // 카메라 on/off 버튼
const cameraSelect = document.querySelector('#cameraSelect');  // 카메라 변경 select
const callDiv      = document.querySelector('#call');          // video관련 div
const welcomeDiv   = document.querySelector('#welcome');       // room입장관련 div
const welcomeForm  = welcomeDiv.querySelector('form');         // room입장 form
 
// 맨 처음엔, video 관련 div는 보이지 않도록 (방입장후에 보이도록)
callDiv.hidden = true;

let myPeerConnection;   // 상대 브라우저와의 연결
let myStream;           // 내 비디오/오디오 정보
let shareStream;
let roomName;           // 방이름
let muted     = false;  // 오디오 on 초기화
let cameraOff = false;  // 카메라 on 초기화

// 비디오 디바이스 리스트를 select option 요소로 만들어 표시
const renderCameraSelect = (videoDevices) => {
        
    let option = videoDevices.map(video => `<option value="${video.deviceId}">${video.label}</option>`);    

    cameraSelect.insertAdjacentHTML('beforeend', option);
}

// 
const getCameras = async () => {
    try {
        // 브라우저에서 사용가능한 미디어 장치 목록을 반환함 (promise를 반환)
        const devices = await navigator.mediaDevices.enumerateDevices();        
        // 미디어 장치 목록에서 video 장치만을 획득
        const videoDevices  = devices.filter(device => device.kind === 'videoinput');
        // 미디어 스트림객체에서 비디오 트랙 객체의 배열을 반환하는 메소드이다. 
        const currentCamera = myStream.getVideoTracks()[0];
        // 사용가능한, 미디어 비디오 장치를 select option에 표시한다. 
        renderCameraSelect(videoDevices);

        // 사용가능한 videoDevices 목록중에서, 현재 미디어 스트림에서 사용하고 있는 비디오를 선택
        const currentDevice = videoDevices.filter(camera => camera.label === currentCamera.label)[0];
        // select의 Default 값으로써 설정
        cameraSelect.value  = currentDevice.deviceId;        
    } catch (e) {
        console.error(e.message);
    }
}

const getMedia = async (deviceId) => {
    
    // const initConstrains = {
    //     audio: true,
    //     video: { facingMode: "user" }, // 모바일인 경우 전면 카메라를 사용하기 위함 ('environment' 는 후면 카메라 사용)
    // };

    // const cameraConstrains = {
    //     audio: true,
    //     video: { deviceId: { exact: deviceId } }, // exact 는 deviceId가 정확히 일치하는 디바이스만 사용하도록 (일치하지 않으면, 비디오 스트림이 없음)
    // };
    
    try {

        myStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "user" },
        });            

        myFace.srcObject = myStream;

        if ( ! deviceId) await getCameras();
        
    } catch (e) {
        console.error(e.message);
    }
}

const getScreen = async () => {
    shareStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: { echoCancellation: true, noiseSuppression: true },
    });

    shareFace.srcObject = shareStream;

    // const videoTrack = myStream.getVideoTracks()[0];    
}

const handleMuteBtnClick = () => {        

    // track.enabled가 true이면 현재 사용되고 있는 track이란 의미, 클릭할 때마다 boolean값을 not하게 해주면 toggle방식으로 변경됨
    myStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);

    muted = ! muted;
    muteBtn.innerHTML = muted ? 'Unmute' : 'Mute';
}
const handleTurnCameraBtnClick = () => {    
    
    // track.enabled가 true이면 현재 사용되고 있는 track이란 의미, 클릭할 때마다 boolean값을 not하게 해주면 toggle방식으로 변경됨
    myStream.getVideoTracks().forEach(track => track.enabled = ! track.enabled);

    cameraOff = ! cameraOff;
    cameraBtn.innerHTML = `Turn Camera ${cameraOff ? 'On' : 'Off'}`;      
}

const handleCameraChange = async (e) => {

    // 화면 공유를 선택했을 경우
    if (e.target.value === 'shareScreen') return getScreen();

    await getMedia(e.target.value);

    // 다른 브라우저와 연결이되어 있는 경우에는, 다른 브라우저에 전달하는 stream내용을 변경해야지, a에서 변경한 카메라 스트림이 b에서도 적용이됨
    if(myPeerConnection) {

        const videoTrack  = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection.getSenders().find(sender => sender.track.kind === 'video');
        videoSender.replaceTrack(videoTrack);
    }
}

// RTC Code
const handleIce = (data) => {
    console.log('sent the iceCandidate');
    socket.emit('ice', data.candidate, roomName);
}

const initCall = async () => {
    
    welcomeDiv.hidden = true;
    callDiv.hidden    = false;

    await getMedia();
    // makeConnection();
}

const handleWelcomeSubmit = async (e) => {

    e.preventDefault();
    // const input = welcomeForm.querySelector('input');
    await initCall();
    // socket.emit('enter_room', input.value);
    // roomName    = input.value;
    // input.value = '';
}

const handleAddStream = (data) => {
    // const peerFace     = document.querySelector('#peerFace')
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

// 방입장 클릭 
welcomeForm.addEventListener('submit', handleWelcomeSubmit);
// 음소거 버튼 클릭
muteBtn.addEventListener('click', handleMuteBtnClick);
// 카메라 on/off 버튼 클릭
cameraBtn.addEventListener('click', handleTurnCameraBtnClick);

stopBtn.addEventListener('click', () => {
    
    // console.log('hi');
    // const videoTrack = myStream.getVideoTracks(); // 화면 공유 비디오 트랙 가져오기
    // videoTrack.stop();
    const shareTracks = shareStream.getTracks();
    // console.log(tracks, videoTrack); 
    shareTracks.forEach(track => track.stop());
});

// 카메라 선택 변경
cameraSelect.addEventListener('input', handleCameraChange);