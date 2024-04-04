const kafka = require('../kafkaBroker/kafka');

try{
    const consumer = kafka.consumer({groupId: "Orchestrator"});
    consumer.connect()
    consumer.subscribe({
        topic: 'ORCHESTATOR_SERVICE',
        partition: 1,
        fromBeginning: true
    })
    consumer.run({
        eachMessage:({ topic, partition, message }) => {
            console.log('Received message', {
            topic,
            partition,
            key: message.key.toString(),
            value: message.value.toString()
            })
        }
    })
}
catch(e){
  try {
    consumer.disconnect()
  } catch (e) {
    console.error('Failed to gracefully disconnect consumer', e)
  }
  process.exit(1)
}