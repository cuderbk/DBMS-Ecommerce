const kafka = require('./kafka');
const CONFIG = require('./config');

const topics = [
    { topic : CONFIG.ORDER_CREATE_REQUEST,partitions : 1,replicationFactor : 1 },
    { topic : CONFIG.ORDER_CREATE_RESPONSE,partitions : 1,replicationFactor : 1 },
    { topic : CONFIG.ORDER_CREATED, partitions : 1,replicationFactor : 1 },

    { topic : CONFIG.PRODUCT_VERIFY,partitions : 1,replicationFactor : 1 },
    { topic : CONFIG.PRODUCT_RESPONSE,partitions : 1,replicationFactor : 1 },
    { topic : CONFIG.ORDER_COMMAND_REQUEST,partitions : 1,replicationFactor : 1 },

    { topic : CONFIG.PAYMENT_VERIFY,partitions : 1,replicationFactor : 1 },
    { topic : CONFIG.PAYMENT_RESPONSE,partitions : 1,replicationFactor : 1 },

]
const admin = kafka.admin()

const main = async () => {
  await admin.connect()
  
  // topics.forEach(async element => {
  //   await admin.deleteTopics({
  //     topics: element.topic,
  //     timeout: 3000
  //   })
  // });
  // await admin.createTopics({
  //   topics: [{ topic : CONFIG.ORDER_CREATED, partitions : 1,replicationFactor : 1 }],
  //   waitForLeaders: true,
  // })
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