const express = require('express'); // Importa la biblioteca Express para crear un servidor web.
const http = require('http'); // Importa la biblioteca HTTP para crear un servidor HTTP.
const socketIo = require('socket.io'); // Importa la biblioteca Socket.IO para la comunicación en tiempo real.
const rpio = require('rpio'); // Importa la biblioteca rpio para controlar los pines GPIO.

const app = express(); // Crea una instancia de Express.
const server = http.createServer(app); // Crea un servidor HTTP utilizando Express.
const io = socketIo(server); // Configura Socket.IO para trabajar con el servidor HTTP.

const DIO0_PIN = 18; // Definición del pin DIO0 (interrupción)
const RESET_PIN = 25; // Definición del pin de reinicio

const frequency = 433E6; // Frecuencia LoRa (ajusta según tu configuración)

// Configura el módulo RFM95
rpio.init({ gpiomem: false }); // Inicializa rpio (configura el acceso a los pines GPIO).
rpio.open(DIO0_PIN, rpio.INPUT); // Configura el pin DIO0 como entrada (para manejar interrupciones).

const SPI = require('pi-spi'); // Importa la biblioteca pi-spi para la comunicación SPI.
const spi = SPI.initialize('/dev/spidev0.0'); // Inicializa la comunicación SPI con el dispositivo.

spi.clockSpeed(500000); // Establece la velocidad de reloj SPI a 500 kHz.

io.on('connection', (socket) => {
  console.log('Usuario conectado'); // Maneja la conexión de un cliente Socket.IO.
});

// Configura la comunicación SPI con el módulo RFM95
spi.transfer(new Buffer([0x80 | 0x00, 0x00])); // Envia un comando para configurar el modo Sleep.
spi.transfer(new Buffer([0x80 | 0x01, 0x01])); // Envia un comando para configurar el modo LoRa.
spi.transfer(new Buffer([0x80 | 0x09, 0xFF])); // Envia un comando para configurar la potencia de salida.
spi.transfer(new Buffer([0x80 | 0x0B, 0x0B])); // Envia un comando para configurar la corriente Ocp.
spi.transfer(new Buffer([0x80 | 0x0D, 0x95])); // Envia un comando para configurar la potencia LNA.
spi.transfer(new Buffer([0x80 | 0x0E, 0x00])); // Envia un comando para configurar el puntero FIFO Rx.
spi.transfer(new Buffer([0x80 | 0x0F, 0x00])); // Envia un comando para configurar el puntero FIFO Rx.

// Configura una interrupción en el pin DIO0 para manejar la recepción de datos LoRa.
rpio.poll(DIO0_PIN, (pin) => {
  const data = spi.transfer(new Buffer([0x00, 0x00])); // Lee los datos desde el FIFO del módulo RFM95.
  const randomValue = data[1]; // Ajusta esto según tu protocolo de comunicación.

  io.emit('message', randomValue); // Emite los datos a través de Socket.IO para que los clientes los reciban.
}, rpio.POLL_LOW);

// Inicia el servidor web en el puerto 3000.
server.listen(3000, () => {
  console.log('Servidor web y Socket.IO escuchando en el puerto 3000');
});
