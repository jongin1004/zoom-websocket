// const messageList  = document.querySelector('ul');
// const messageForm  = document.querySelector('#message');
// const nicknameForm = document.querySelector('#nick');
// // const socket = new WebSocket('ws://' + window.location.host);

// socket.addEventListener('open', () => {
//     console.log('Connected to Server');
// }) 

// socket.addEventListener('message', (data) => {
//     const message = JSON.parse(data.data);

//     const HTML = `<li>${message}</li>`;
//     messageList.insertAdjacentHTML('beforeend', HTML);
// }) 

// socket.addEventListener('close', () => {
//     console.log('DisConnected from Server');
// }) 

// const setMessageByType = (type, payload) => {
//     const message = {type, payload};
//     return JSON.stringify(message);
// }
// messageForm.addEventListener('submit', function(e) {

//     e.preventDefault();
//     const input = this.querySelector('input');
//     socket.send(setMessageByType('message', input.value));
//     input.value = '';
// });

// nicknameForm.addEventListener('submit', function(e) {

//     e.preventDefault();
//     const input = this.querySelector('input');
//     socket.send(setMessageByType('nickname', input.value));
//     input.value = '';
// });

const socket = io();

const welcome     = document.querySelector('#welcome');
const roomForm    = welcome.querySelector('form');
const chat        = document.querySelector('#chat');
const messageForm = chat.querySelector('form');
const room        = document.querySelector('#room');

chat.hidden = true;
let roomName;

const renderRoomTitle = (userCount) => {
    const roomTitle     = chat.querySelector('h3');
    roomTitle.innerText = `Room: ${roomName} (${userCount})`;
}
const enterRoom = (userCount) => {
    welcome.hidden = true;
    chat.hidden    = false;    

    renderRoomTitle(userCount);

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input   = messageForm.querySelector('input');
        const message = input.value;

        socket.emit('message', roomName, message, () => {
            insertMessage(`Your Message: ${message}`);
        });
        
        input.value = '';
    });
}

roomForm.addEventListener('submit', (e) => {
    
    e.preventDefault();

    const roomNameInput = roomForm.querySelector('input[name="roomName"]');
    const nicknameInput = roomForm.querySelector('input[name="nickname"]');
    socket.emit('enter_room', roomNameInput.value, nicknameInput.value, enterRoom);

    roomName    = roomNameInput.value;
    // roomNameInput.value = '';
});

const insertMessage = (message) => {
    const HTML = `<li>${message}</li>`;
    chat.querySelector('ul').insertAdjacentHTML('beforeend', HTML);
}

socket.on('welcome', (nickname, userCount) => {
    renderRoomTitle(userCount);
    insertMessage(`${nickname}님이 채팅방에 참가했습니다.`);
});

socket.on('bye', (nickname, userCount) => {
    renderRoomTitle(userCount);
    insertMessage(`${nickname}님이 채팅방을 떠났습니다.`);
});

socket.on('message', (message) => {
    insertMessage(message);
});

socket.on('room_change', (rooms) => {
    
    const roomList = room.querySelector('ul');
    roomList.innerHTML = '';    

    if (rooms.length < 1) return;

    const HTML = rooms.map(room => `<li>${room}</li>`);
    roomList.innerHTML = HTML;
});