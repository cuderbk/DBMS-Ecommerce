const kafka = require('./kafkaConfig');
const CONFIG = require('../../config/index');

const topics = [
    { topic : CONFIG.ORDER_CREATE_REQUEST,partitions : 1,replicationFactor : 1 },
    { topic : CONFIG.ORDER_CREATE_RESPONSE,partitions : 1,replicationFactor : 1 },
    { topic : CONFIG.PRODUCT_VERIFY,partitions : 1,replicationFactor : 1 },
    { topic : CONFIG.PRODUCT_RESPONSE,partitions : 1,replicationFactor : 1 },
    { topic : CONFIG.PAYMENT_VERIFY,partitions : 1,replicationFactor : 1 },
    { topic : CONFIG.PAYMENT_RESPONSE,partitions : 1,replicationFactor : 1 }
    { topic : CONFIG.PAYMENT_COMMITTED,partitions : 1,replicationFactor : 1 }

    // { topic : 'STOCK_SERVICE',partitions : 1,replicationFactor : 1 },
    // { topic : 'ORCHESTATOR_SERVICE',partitions : 1,replicationFactor : 1 }
]
const admin = kafka.admin()

const main = async () => {
  await admin.connect()
  await admin.createTopics({
    topics: topics,
    waitForLeaders: true,
  })
  console.log("Successfully intilize")
}

main().catch(error => {
  console.error(error)
  process.exit(1)
}) 