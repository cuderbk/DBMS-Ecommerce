const dotEnv = require("dotenv").config();

module.exports = {
  SERVICE_NAME: 'OrderService',
  PORT: process.env.ORDER_SERVICE_PORT,
  DB_URL: process.env.ORACLE_URL,
  APP_SECRET: process.env.APP_SECRET,
  EXCHANGE_NAME: process.env.EXCHANGE_NAME,
  KAFKA_BROKER: process.env.KAFKA_BROKER,
  CONSUMER_GROUP : 'OrderGroup',
  ORDER_CREATED : 'OrderCreated',
  ORDER_CREATE_REQUEST : 'OrderCreateRequest',
  ORDER_CREATE_RESPONSE : 'OrderCreateResponse',
  PAYMENT_REQUEST : 'PaymentRequest',
  PAYMENT_RESPONSE : 'PaymentResponse'

};