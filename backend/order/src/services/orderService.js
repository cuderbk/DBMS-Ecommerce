const {getCassClient, getClientOracle} = require('../database/index');
const cassandra = require('cassandra-driver');
const oracledb = require("oracledb")
const { v4: uuidv4 } = require("uuid");
const kafka = require('./kafkaService/kafkaConfig');
const {Partitioners} = require('kafkajs');

const {CONSUMER_GROUP, 
    ORDER_CREATE_REQUEST, 
    ORDER_CREATE_RESPONSE,
    ORDER_CREATED
    } = require('../config/index');
const { order } = require('../api/order');

class OrderService{
    constructor() {
        this.initilizeDB();
        this.consumer = kafka.consumer({ groupId: CONSUMER_GROUP });
        this.producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });
        console.log('CustomerService initialized');
    }
    async initilizeDB(){
        this.CassClient =await getCassClient();
        try {
            await this.CassClient.connect();
            console.log('Connected to Cassandra');
        } catch (err) {
            console.error('Error connecting to Cassandra:', err);
            throw err; // Re-throw the error to handle it elsewhere
        }
        this.oracleClient =await getClientOracle();

    }
    async processOrderMessage(message) {
        // Process order message and perform necessary operations
        const actions = [
            async (callback) => {
                try {
                    // Perform order creation operation
                    // For example:
                    // await connection.insert(...);
                    // await connection.update(...);
                    callback(null, 'Order creation successful');
                } catch (error) {
                    callback(error);
                }
            },
            async (callback) => {
                try {
                    // Perform other operations like updating inventory, processing payment, etc.
                    callback(null, 'Other operations successful');
                } catch (error) {
                    callback(error);
                }
            }
        ];

        // Run actions in a transaction
        try {
            // const results = await this.oracleClient.transaction(actions);
            // this.ProduceMessage
            console.log('Order create completed:');
            // Continue flow...
        } catch (error) {
            console.error('Error processing order message:', error);
            // Handle error...
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
                topics: [ORDER_CREATE_REQUEST],
                fromBeginning: true
            });
            await this.consumer.run({
                eachMessage: ({ topic, partition, message }) => {
                    // Handle messages
                    if(topic == ORDER_CREATE_REQUEST){
                        const order_detail = JSON.parse(message.value)
                        console.log(order_detail)
                        const order_response = {
                            status: "CREATED"
                        }
                        this.ProduceMessage(ORDER_CREATE_RESPONSE, order_response)

                        this.ProduceMessage(ORDER_CREATED, {product_list:order_detail.product_list })
                        console.log("done")
                    }
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
};
module.exports = OrderService;