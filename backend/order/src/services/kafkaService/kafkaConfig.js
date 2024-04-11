const {Kafka} = require('kafkajs');
const CONFIG = require('../../config/index');

const kafka = new Kafka({
    clientId: CONFIG.SERVICE_NAME,
    brokers: ["localhost:9092"]
});

module.exports = kafka;