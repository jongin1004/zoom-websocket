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
const room        = document.querySelector('#room');
const messageForm = room.querySelector('form');

room.hidden = true;
let roomName;

const enterRoom = () => {
    welcome.hidden = true;
    room.hidden    = false;

    const roomTitle     = room.querySelector('h3');
    roomTitle.innerText = `Room: ${roomName}`;

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

    const input = roomForm.querySelector('input');
    socket.emit('enter_room', input.value, enterRoom);

    roomName    = input.value;    
    input.value = '';
});

const insertMessage = (message) => {
    const HTML = `<li>${message}</li>`;
    room.querySelector('ul').insertAdjacentHTML('beforeend', HTML);
}

socket.on('welcome', () => {
    insertMessage('someone joined');
});

socket.on('bye', () => {
    insertMessage('someone left');
});

socket.on('message', (message) => {
    insertMessage(message);
});