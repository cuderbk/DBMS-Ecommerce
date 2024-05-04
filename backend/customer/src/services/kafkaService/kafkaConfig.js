const {Kafka, logLevel} = require('kafkajs');
const CONFIG = require('../../config/index');

const kafka = new Kafka({
    clientId: CONFIG.SERVICE_NAME,
    brokers: ["localhost:9092"],
    logLevel: logLevel.ERROR,
    retry: {
        initialRetryTime: 100,
        retries: 8
      },
});

module.exports = kafka;