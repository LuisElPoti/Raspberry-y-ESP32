const { SX127x } = require('sx127x-raspi');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const sx127x = new SX127x({
  frequency: 433E6, // Frecuencia LoRa
  spreadingFactor: 7, // Factor de propagación
  signalBandwidth: 125E3, // Ancho de banda de la señal
  dio0Pin: 18, // Pin DIO0
  resetPin: 14, // Pin de reinicio
  syncWord: 0x12, // Palabra de sincronización
});

io.on('connection', (socket) => {
  console.log('Usuario conectado');
});

sx127x.open();

sx127x.on('data', (data) => {
  const randomValue = data[0];
  io.emit('message', randomValue);
});

server.listen(3000, () => {
  console.log('Servidor web y Socket.IO escuchando en el puerto 3000');
});
