const express = require("express");
const cors = require("cors");
const proxy = require("express-http-proxy");
const dotenv = require('dotenv').config();
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
  }
});

// Store the Socket.IO instance in the app
app.set('io', io);

io.on('connection', (socket) => {
  console.log('a user connected');

  // Handle incoming events from clients
  // socket.on('event_from_client', (data) => {
  //   console.log('Received event from client:', data);

  //   // Example: Broadcast to all connected clients
  //   io.emit('event_to_clients', data);
  // });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

app.use(cors());
app.use(express.json());

// Proxy routes to microservices
app.use("/product", proxy(`http://localhost:${process.env.PRODUCT_SERVICE_PORT}`));
app.use("/customer", proxy(`http://localhost:${process.env.CUSTOMER_SERVICE_PORT}`));
app.use("/order", proxy(`http://localhost:${process.env.ORDER_SERVICE_PORT}`));

server.listen(8000, () => {
  console.log("Gateway is Listening to Port 8000");
});
