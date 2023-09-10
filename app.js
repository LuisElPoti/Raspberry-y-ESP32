const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const SPI = require('pi-spi');
const rfm9x = require('rfm9x');
const Gpio = require('onoff').Gpio;

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Opciones de configuración de RFM9x
//const spiSpeedHz = 100000; // Velocidad de la comunicación SPI
//const frequencyMhz = 868.2; // Frecuencia en MHz

const options = {
  frequencyMhz: 868.2,
  bandwidthHz: 500000,
  codingRate: 5,
  spreadingFactor: 7,
};


const rfm95 = new rfm9x()

async function main() {
  try {
    // Inicializar el módulo RFM9x primero
    await rfm95.init(options);
    console.log('RFM9x initialized');

    // Iniciar la recepción de paquetes
    await rfm95.startReceive();

    rfm95.on('receive', (packet) => {
      // Aquí procesa los datos recibidos desde el ESP32
      const payload = packet.payload;
      const nodeAddr = payload[0]; // Dirección del nodo (ESP32)
      const temp = (payload[2] << 8) | payload[1]; // Temperatura en C
      const humd = (payload[4] << 8) | payload[3]; // Humedad en %

      console.log('Received from Node:', nodeAddr);
      console.log('Temperature:', temp / 10, 'C');
      console.log('Humidity:', humd / 10, '%');

      // Emitir los datos a la página web a través de Socket.IO
      io.emit('update_data', { nodeAddr, temp: temp / 10, humd: humd / 10 });
    });

    rfm95.on('receiveError', () => {
      console.log('Received invalid packet');
    });
  } catch (error) {
    console.error('Error initializing RFM9x:', error);
  }
}

// Rutas para la página web
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Eventos de Socket.IO
io.on('connection', (socket) => {
  console.log('Cliente conectado');

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Iniciar el servidor HTTP
server.listen(5000, '0.0.0.0', () => {
  console.log('Servidor escuchando en http://0.0.0.0:5000');
  main(); // Iniciar la inicialización de RFM9x después de iniciar el servidor
});