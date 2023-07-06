import express from "express";
import { WebSocketServer } from "ws";
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
const wss = new WebSocketServer({ server });

const handleConnection = (socket) => {
    console.log(socket);
}

// const handleListening = (data) => {
//     console.log(data);
// }
wss.on('connection', handleConnection);

// wss.on('listening', handleListening);

server.listen(3000, handleListen);