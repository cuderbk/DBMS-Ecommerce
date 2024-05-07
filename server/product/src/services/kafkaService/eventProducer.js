const CONFIG = require('../../config/index.js');
const kafka = require('./kafkaConfig');
const {Partitioners} = require('kafkajs');

const producer = kafka.producer({createPartitioner: Partitioners.LegacyPartitioner});

const OrderResponsePayload = {
    status: 'Canceled' // Created
}
const newOrder = async (topic, payload, key) => {
    // Producing
    await producer.connect();
    console.log(payload);
    if (key) {
        await producer.send({
            topic: topic,
            messages: [
                {
                    value: JSON.stringify(payload),
                    key
                },
            ],
        });
    } else {
        await producer.send({
            topic: topic,
            messages: [
                { value: JSON.stringify(payload) },
            ],
        });
    }
}
newOrder(CONFIG.ORDER_CREATE_REQUEST, {
    "product_id": 1,
    "description": "hehe"
})
module.exports = newOrder;