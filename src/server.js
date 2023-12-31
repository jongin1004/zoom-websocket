import express from "express";
// import { WebSocketServer } from "ws";
import {Server} from 'socket.io';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { instrument } from "@socket.io/admin-ui";
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

io.on('connection', socket => {

    socket.on('enter_room', roomName => {

        socket.join(roomName);        
        socket.to(roomName).emit('welcome')
    });

    socket.on('offer', (offer, roomName) => {
        socket.to(roomName).emit('offer', offer);
    });

    socket.on('answer', (answer, roomName) => {
        socket.to(roomName).emit('answer', answer);
    });

    socket.on('ice', (ice, roomName) => {
        socket.to(roomName).emit('ice', ice);
    });
});

server.listen(3000, handleListen);