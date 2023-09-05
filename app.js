const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configurar el puerto serie para el módulo LoRa
const portName = '/dev/ttyAMA0'; // Cambia esto según tu configuración
const serialPort = new SerialPort({path: portName,  baudRate: 115200} );
const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

let valorAleatorio = null;

// Configurar la vista de la página web
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index', { valor: valorAleatorio });
});

// Escuchar datos del puerto serienpm i 
parser.on('data', (data) => {
  valorAleatorio = data.trim(); // Elimina los espacios en blanco y saltos de línea
  console.log("Valor recibido del ESP32: " + valorAleatorio);

  // Emite los datos a través de Socket.IO para actualizar la página web.
  io.emit('message', valorAleatorio);
});

// Iniciar el servidor web y Socket.IO en el puerto 3000
server.listen(3000, () => {
  console.log('Servidor web y Socket.IO escuchando en el puerto 3000');
});
