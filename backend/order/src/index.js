const express = require('express');
const consumer = require('./services/kafkaService/eventConsumer');

// const app = express();
consumer();
// app.listen(CONFIG.SERVICE_PORT, () => 
//     logger.info(`Running Booking server port: ${CONFIG.SERVICE_PORT}`)
// );