const {getCassClient} = require('../database/index');
const kafka = require('./kafkaService/kafkaConfig');
const {Partitioners} = require('kafkajs');
const {CONSUMER_GROUP, 
    ORDER_CREATE_REQUEST, 
    ORDER_CREATE_RESPONSE
    } = require('../config/index');

class CustomerService{
    constructor() {
        this.CassClient = getCassClient();
        this.consumer = kafka.consumer({ groupId: CONSUMER_GROUP });
        this.producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });
        console.log('CustomerService initialized');
    }

    async getUserCart() {
        try {
            const query = 'SELECT * FROM user_carts WHERE user_id = ?';
            params = [2];
            const result = await this.CassClient.execute(query, params = params, {prepare : true});
            console.log('Cart of %s', result.rows[0]);
        } catch (error) {
            console.error('Error retrieving user cart:', error);
        }
    }
    async SubscribeEvents() {
        try {
            // Check if this.consumer is defined before connecting
            if (!this.consumer) {
                throw new Error('Consumer is not initialized');
            }
            await this.consumer.connect();
            await this.consumer.subscribe({
                topics: [ORDER_CREATE_REQUEST, ORDER_CREATE_RESPONSE],
                fromBeginning: true
            });
            await this.consumer.run({
                eachMessage: ({ topic, partition, message }) => {
                    // Handle messages
                    console.log(topic);
                }
            });
            console.log('Subscribed to events');
        } catch (error) {
            await this.consumer.disconnect();
            console.error('Failed to subscribe to events:', error);
            process.exit(1);
        }
    }

    async ProduceMessage(topic, payload, key){
        await this.producer.connect();
        console.log(payload);
        if (key) {
            await this.producer.send({
                topic: topic,
                messages: [
                    {
                        value: JSON.stringify(payload),
                        key
                    },
                ],
            });
        } else {
            await this.producer.send({
                topic: topic,
                messages: [
                    { value: JSON.stringify(payload) },
                ],
            });
        } 
    }
}
module.exports = CustomerService;