class AppView {
    myFace       = document.querySelector('#myFace');        // 내 video element
    peerFace     = document.querySelector('#peerFace');      // 상대 video element
    shareFace     = document.querySelector('#shareFace');      // 상대 video element
    muteBtn      = document.querySelector('#muteBtn');       // 오디오 on/off 버튼
    cameraBtn    = document.querySelector('#cameraBtn');     // 카메라 on/off 버튼
    shareBtn      = document.querySelector('#shareBtn');     // 카메라 on/off 버튼
    cameraSelect = document.querySelector('#cameraSelect');  // 카메라 변경 select
    callDiv      = document.querySelector('#call');          // video관련 div
    welcomeDiv   = document.querySelector('#welcome');       // room입장관련 div
    welcomeForm  = this.welcomeDiv.querySelector('form');         // room입장 form

    // 비디오 디바이스 리스트를 select option 요소로 만들어 표시
    _renderCameraSelect = (videoDevices) => {
            
        let option = videoDevices.map(video => `<option value="${video.deviceId}">${video.label}</option>`);    

        cameraSelect.insertAdjacentHTML('beforeend', option);
    }
}

export default new AppView();