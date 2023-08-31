const Rf95 = require('rh_rf95');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const rf95 = new Rf95();

io.on('connection', (socket) => {
  console.log('Usuario conectado');
});

rf95.init();
rf95.setFrequency(433E6);
rf95.setTxPower(14, false);

rf95.on('data', (data) => {
  const randomValue = data.readUInt8(0);
  io.emit('message', randomValue);
});

server.listen(3000, () => {
  console.log('Servidor web y Socket.IO escuchando en el puerto 3000');
});
