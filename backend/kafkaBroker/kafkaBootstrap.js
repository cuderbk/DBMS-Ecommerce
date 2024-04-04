const kafka = require('./kafkaHandler/kafka');

const topics = [
    { topic : 'ORDER_SERVICE',partitions : 1,replicationFactor : 1 },
    { topic : 'PAYMENT_SERVICE',partitions : 1,replicationFactor : 1 },
    { topic : 'STOCK_SERVICE',partitions : 1,replicationFactor : 1 },
    { topic : 'ORCHESTATOR_SERVICE',partitions : 1,replicationFactor : 1 }
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
