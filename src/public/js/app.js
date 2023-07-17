import view from './appView.js';

class App {

    socket = io();
    
    myPeerConnection;   // 상대 브라우저와의 연결
    myStream;           // 내 비디오/오디오 stream
    shareStream;        // 화면공유 비디오/오디오 stream
    roomName;           // 방이름
    shared    = false;  // 화면공유 off 초기화
    muted     = false;  // 오디오 on 초기화
    cameraOff = false;  // 카메라 on 초기화


    constructor()
    {
        this._init();
        // 맨 처음엔, video 관련 div는 보이지 않도록 (방입장후에 보이도록)
        view.callDiv.hidden = true;
    }

    _init()
    {
        // 방입장 클릭 
        view.welcomeForm.addEventListener('submit', this._handleWelcomeSubmit.bind(this));
        // 음소거 버튼 클릭
        view.muteBtn.addEventListener('click', this._handleMuteBtnClick.bind(this));
        // 카메라 on/off 버튼 클릭
        view.cameraBtn.addEventListener('click', this._handleTurnCameraBtnClick.bind(this));

        view.shareBtn.addEventListener('click', this._handlerTurnShareStreamClick.bind(this));
        // 카메라 선택 변경
        view.cameraSelect.addEventListener('input', this._handleCameraChange.bind(this));
    }

    // 
    async _getCameras()
    {
        try {
            // 브라우저에서 사용가능한 미디어 장치 목록을 반환함 (promise를 반환)
            const devices = await navigator.mediaDevices.enumerateDevices();        
            // 미디어 장치 목록에서 video 장치만을 획득
            const videoDevices  = devices.filter(device => device.kind === 'videoinput');
            // 미디어 스트림객체에서 비디오 트랙 객체의 배열을 반환하는 메소드이다. 
            const currentCamera = this.myStream.getVideoTracks()[0];
            // 사용가능한, 미디어 비디오 장치를 select option에 표시한다. 
            view._renderCameraSelect(videoDevices);

            // 사용가능한 videoDevices 목록중에서, 현재 미디어 스트림에서 사용하고 있는 비디오를 선택
            const currentDevice = videoDevices.filter(camera => camera.label === currentCamera.label)[0];
            // select의 Default 값으로써 설정
            view.cameraSelect.value  = currentDevice.deviceId;        
        } catch (e) {
            console.error(e.message);
        }
    }

    async _getScreen()
    {
        this.shareStream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: 'always' },
            audio: { echoCancellation: true, noiseSuppression: true },
        });
    
        view.shareFace.srcObject = this.shareStream;
    
        // const videoTrack = myStream.getVideoTracks()[0];    
    }

    async _getMedia(deviceId)
    {
        try {
            // facingMode : 모바일인 경우 전면 카메라를 사용하기 위함 ('environment' 는 후면 카메라 사용)
            // exact : deviceId가 정확히 일치하는 디바이스만 사용하도록 (일치하지 않으면, 비디오 스트림이 없음)
            this.myStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "user" },
            });            

            view.myFace.srcObject = this.myStream;

            if ( ! deviceId) await this._getCameras();
            
        } catch (e) {
            console.error(e.message);
        }
    }

    _handleMuteBtnClick()
    {        

        // track.enabled가 true이면 현재 사용되고 있는 track이란 의미, 클릭할 때마다 boolean값을 not하게 해주면 toggle방식으로 변경됨
        this.myStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
    
        this.muted = ! this.muted;
        view.muteBtn.innerHTML = this.muted ? '음소거해제' : '음소거';
    }

    _handleTurnCameraBtnClick()
    {     
        // track.enabled가 true이면 현재 사용되고 있는 track이란 의미, 클릭할 때마다 boolean값을 not하게 해주면 toggle방식으로 변경됨
        this.myStream.getVideoTracks().forEach(track => track.enabled = ! track.enabled);
    
        this.cameraOff = ! this.cameraOff;
        view.cameraBtn.innerHTML = this.cameraOff ? '카메라 켜기' : '카메라 끄기';      
    }
    
    async _handleCameraChange(e)
    {
        // 화면 공유를 선택했을 경우
        if (e.target.value === 'shareScreen') return this._getScreen();
    
        await getMedia(e.target.value);
    
        // 다른 브라우저와 연결이되어 있는 경우에는, 다른 브라우저에 전달하는 stream내용을 변경해야지, a에서 변경한 카메라 스트림이 b에서도 적용이됨
        if(myPeerConnection) {
    
            const videoTrack  = this.myStream.getVideoTracks()[0];
            const videoSender = this.myPeerConnection.getSenders().find(sender => sender.track.kind === 'video');
            videoSender.replaceTrack(videoTrack);
        }
    }
    
    _handlerTurnShareStreamClick()
    {    
        this.shared = ! this.shared;
        view.shareBtn.innerHTML = this.shared ? '화면공유종료' : '화면공유';
    
        if (this.shared) {
    
            this._getScreen();
        } else {        
    
            const shareTracks = this.shareStream.getTracks();
            shareTracks.forEach(track => track.stop());
        }
    };

    async _handleWelcomeSubmit(e)
    {
        e.preventDefault();
        // const input = welcomeForm.querySelector('input');
        await this._initCall();
        // socket.emit('enter_room', input.value);
        // roomName    = input.value;
        // input.value = '';
    }

    async _initCall()
    {
        view.welcomeDiv.hidden = true;
        view.callDiv.hidden    = false;

        await this._getMedia();
        // makeConnection();
    }
}

new App();


// // RTC Code
// const handleIce = (data) => {
//     console.log('sent the iceCandidate');
//     socket.emit('ice', data.candidate, roomName);
// }



// const handleAddStream = (data) => {
//     // const peerFace     = document.querySelector('#peerFace')
//     peerFace.srcObject = data.stream;
//     console.log('got an event from my peer');
//     console.log(data);
// }

// const makeConnection = () => {
//     myPeerConnection = new RTCPeerConnection({
//         iceServers: [
//             {
//                 urls: [
//                     "stun:stun.l.google.com:19302",
//                     "stun:stun1.l.google.com:19302",
//                     "stun:stun2.l.google.com:19302",
//                     "stun:stun3.l.google.com:19302",
//                     "stun:stun4.l.google.com:19302",
//                 ]
//             }
//         ]
//     });    
//     myPeerConnection.addEventListener('icecandidate', handleIce);
//     myPeerConnection.addEventListener('addstream', handleAddStream)
//     myStream.getTracks().forEach(track => myPeerConnection.addTrack(track, myStream));    
// }

// socket.on('welcome',async () => {   
//     console.log('someone enter in this room');
//     const offer = await myPeerConnection.createOffer();
//     await myPeerConnection.setLocalDescription(offer);
//     console.log('sent the offer'); 
//     socket.emit('offer', offer, roomName);
// });

// socket.on('offer', async (offer) => {    
//     console.log('received the offer'); 
//     myPeerConnection.setRemoteDescription(offer);
//     const answer = await myPeerConnection.createAnswer();
//     await myPeerConnection.setLocalDescription(answer);  
//     console.log('sent the answer'); 
//     socket.emit('answer', answer, roomName);
// });

// socket.on('answer', async (answer) => {    
//     console.log('received the answer');
//     await myPeerConnection.setRemoteDescription(answer);
// });

// socket.on('ice', (ice) => {
//     console.log('received the iceCandidate');
//     myPeerConnection.addIceCandidate(ice);
// });

