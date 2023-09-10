const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const Gpio = require('onoff');
const SPI = require('pi-spi');
const rfm9x = require('rfm9x');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configurar pines GPIO
const resetPin = new Gpio(25, 'out');
const dio0Pin = new Gpio(5, 'in', 'rising');

// Opciones de configuración de RFM9x
const spiSpeedHz = 100000; // Velocidad de la comunicación SPI
const frequencyMhz = 868.2; // Frecuencia en MHz

const rfm95 = new rfm9x();

const options = {
  frequencyMhz,
  resetPin,
  dio0Pin,
  spiSpeedHz,
};

async function main() {
  try {
    await rfm95.init(options);
    console.log('RFM9x initialized');

    // Iniciar la recepción de paquetes
    await rfm95.startReceive();

    rfm95.on('receive', (packet) => {
      const { payload } = packet;
      const temp = payload.readUInt16LE(2) / 10.0;
      const humd = payload.readUInt16LE(4) / 10.0;

      console.log('Received temperature:', temp, 'C');
      console.log('Received humidity:', humd, '%');

      // Emitir los datos a la página web a través de Socket.IO
      io.emit('update_data', { temp, humd });
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
  res.sendFile(__dirname + '/index.html');
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
