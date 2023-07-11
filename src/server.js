import express from "express";
// import { WebSocketServer } from "ws";
import {Server} from 'socket.io';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createPublicKey } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use('/public', express.static(__dirname + '/public'));

app.get('/', (req, res) => res.render('home'));
app.get('/*', (req, res) => res.redirect('/'));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

const server = http.createServer(app);
const io     = new Server(server);

 
const getPublicRooms = () => {
    // const {
    //     sockets: {
    //         adapter : {rooms, sids}
    //     }
    // } = io;

    const { rooms, sids } = io.sockets.adapter;
    
    const publicRoom = [];
    rooms.forEach((_, key) => {
        
        if (sids.get(key) === undefined) publicRoom.push(key);
    })
    
    return publicRoom;
}

function getUserCount(roomName)
{
    return io.sockets.adapter.rooms.get(roomName)?.size;
}

io.on('connection', (socket) => {
        
    socket['nickname'] = 'Anonymous';

    socket.on('enter_room', (roomName, nickname, callback) => {
        
        socket.join(roomName);
        socket['nickname'] = nickname;
        socket.to(roomName).emit('welcome', nickname, getUserCount(roomName)); 
        io.sockets.emit('room_change', getPublicRooms());                
        callback(getUserCount(roomName));
    });

    socket.on('disconnecting', () => {
        socket.rooms.forEach(room => socket.to(room).emit('bye', socket['nickname'], getUserCount(room) - 1));
    });

    socket.on('disconnect', () => {
        io.sockets.emit('room_change', getPublicRooms());
    });

    socket.on('message', (roomName, message, callback) => {
        
        socket.to(roomName).emit('message', `${socket['nickname']}: ${message}`);
        callback();
    });
});
  
//   server.listen(3000, () => {
//     console.log('listening on *:3000');
//   });


// const sockets = [];
// const wss = new WebSocketServer({ server });

// wss.on('connection', (socket) => {

//     sockets.push(socket);    
//     socket['nickname'] = 'Anonymous';

//     console.log('Connected to Browser');
//     socket.on("close", () => console.log('Disconnected from the Browser'));

//     socket.on("message", (data) => {

//         const message = JSON.parse(data.toString('utf8'));                

//         switch (message.type) {
//             case "message":
//                 sockets.forEach(aSocket => aSocket.send(JSON.stringify(`${socket.nickname}: ${message.payload}`)));
//             case "nickname":
//                 socket['nickname'] = message.payload;
//         }
//     });    
// });

server.listen(3000, handleListen);