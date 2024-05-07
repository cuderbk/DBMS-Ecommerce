const kafka = require('./kafkaConfig');
const {CONSUMER_GROUP, 
    ORDER_CREATE_REQUEST, 
    PAYMENT_RESPONSE,
    ORDER_CREATE_RESPONSE
    } = require('../../config/index');
const consumer = kafka.consumer({groupId: CONSUMER_GROUP});
const run = async () =>{
    try {
        await consumer.connect()
        await consumer.subscribe({
            topics: [ORDER_CREATE_REQUEST],
            fromBeginning: true
        });
        await consumer.run({
            eachMessage:({ topic, partition, message }) => {
                const newMessage = JSON.parse(message.value.toString());
                console.log(`New order request: ${JSON.stringify(newMessage)}`);
            }
        })
    } catch (e) {
        consumer.disconnect()
        console.error('Failed to gracefully disconnect consumer', e)
        process.exit(1)
    }
};
run();