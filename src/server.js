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

io.on('connection', (socket) => {
    socket.on('enter_room', (roomName, callback) => {
        
        socket.join(roomName);        
        callback(roomName);
        socket.to(roomName).emit('welcome');
    });

    socket.on('disconnecting', () => {
        socket.rooms.forEach(room => socket.to(room).emit('bye'));
    });

    socket.on('message', (roomName, message, callback) => {
        
        socket.to(roomName).emit('message', message);
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