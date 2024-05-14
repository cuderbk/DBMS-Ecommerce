const {getCassClient, getClientOracle} = require('../database/index');
const {getRedis}  = require('..//database/init.redis');
const cassandra = require('cassandra-driver');
const oracledb = require("oracledb");
const redis = require('redis');
const { v4: uuidv4 } = require("uuid");
const kafka = require('./kafkaService/kafkaConfig');
const {Partitioners} = require('kafkajs');

const { FormateData } = require('../utils');
const {CONSUMER_GROUP, 
    ORDER_CREATE_REQUEST, 
    ORDER_CREATE_RESPONSE,
    PAYMENT_VERIFY,
    PAYMENT_RESPONSE,
    PAYMENT_COMMITTED,
    } = require('../config/index');
const { order } = require('../../../order/src/api/order');

class CustomerCommunication{
    // update database prior to del cache
    constructor() {
        this.consumer = kafka.consumer({ 
            groupId: CONSUMER_GROUP,
            heartbeatInterval: 1000, // should be lower than sessionTimeout
            sessionTimeout: 60000, });
        this.orderResponseCusConsumer = kafka.consumer({ 
            groupId: "CUS",
            heartbeatInterval: 1000, // should be lower than sessionTimeout
            sessionTimeout: 60000,  });

        this.orderResponseWalConsumer = kafka.consumer({ 
            groupId: "WAL",
            heartbeatInterval: 1000, // should be lower than sessionTimeout
            sessionTimeout: 60000,  });
        this.producer = kafka.producer({  
            createPartitioner: Partitioners.LegacyPartitioner,
            transactionTimeout: 60000,
            allowAutoTopicCreation: true
         });
         this.admin = kafka.admin();
    }
    async initializeDB() {
        try {
            this.RedisClient = await redis.createClient({
                legacyMode: true,
                isolationPoolOptions: {
                    min: 1,
                    max: 20
                }
            }).connect(); 
            console.log("Connected to Redis");
        } catch (error) {
            console.error("Error initializing DB:", error);
            // Handle the error appropriately, e.g., throw or log
        }
        this.CassClient =await getCassClient();
        try {
            await this.CassClient.connect();
            console.log('Connected to Cassandra');
        } catch (err) {
            console.error('Error connecting to Cassandra:', err);
            throw err; // Re-throw the error to handle it elsewhere
        }
        this.OracleClient = await getClientOracle();
        
        await this.consumer.connect();
        await this.consumer.subscribe({
            topics: [PAYMENT_VERIFY],
            // fromBeginning: true
        });
        await this.orderResponseCusConsumer.connect();
        await this.orderResponseCusConsumer.subscribe({
            topics: [ORDER_CREATE_RESPONSE],
            // fromBeginning: true
        });
        // await this.orderResponseWalConsumer.connect();
        // await this.orderResponseWalConsumer.subscribe({
        //     topics: [ORDER_CREATE_RESPONSE],
        //     // fromBeginning: true
        // });
        await this.producer.connect();
        console.log("Ready");
    }
    async checkOutOrder(user_id, product_list, total_original_price, total_final_price, shipping_address, shipping_method_id) {
        try {
            const currentTimestamp = Date.now()
            // // Produce a message with productids to indicate order creation
            const checkOutStatus = 'Processing'; // Create Paid Shipped
            // "product_list": [
            //     {
            //         "product_item_id": 1,
            //         "quantity": 4,
            //         "price": 2000.0
            //     },
            //     {
            //         "product_item_id": 3,
            //         "quantity": 10,
            //         "price": 400.0
            //     }
            // ],
            const orderPayload = {
                user_id: user_id,
                product_list: product_list, // Array of productids
                shipping_address: shipping_address,
                shipping_method_id:shipping_method_id,
                payment_type: "Wallet",
                order_final_total: total_final_price,
                status: checkOutStatus
            };
            const crypto = require("crypto");

            const orderKey = crypto.randomBytes(16).toString("hex");
            await this.ProduceMessage(ORDER_CREATE_REQUEST, orderPayload, orderKey);
            
            const WalletVerify = await this.getOrderResponse(
                this.consumer, orderKey, PAYMENT_VERIFY
            )
            await this.verifyUserWallet(Number(WalletVerify.user_id), Number(WalletVerify.order_total), orderKey);
            // await this.consumer.disconnect()
            try {
                // Check if this.orderResponseConsumer is defined before connecting
                if (!this.orderResponseCusConsumer) {
                    throw new Error('Consumer is not initialized');
                }
                // await this.orderResponseConsumer.run();
                console.log("?")
                const response = await this.getOrderResponse(this.orderResponseCusConsumer, orderKey, ORDER_CREATE_RESPONSE)
                console.log("checkout ", response)
                if(response.status == 'CREATED'){
                    this.OracleClient.commit()
                    return FormateData({
                        orderId: response.order_id,
                        message: "created"})
                }
                else{
                    this.OracleClient.rollback()
                    return FormateData({
                        status: response.status,
                        reason: response.type
                    })
                } 
            } catch (error) {
                await this.orderResponseCusConsumer.disconnect();
                console.error('Failed to subscribe to events:', error);
                process.exit(1);
            } 
        } catch (error) {
            console.error('Error checking out order:', error);
            throw error;
        }
    }
    async getOrderResponse(cons, user_id, topicConsume) {
        // cons.resume([{ORDER_CREATE_RESPONSE}])
        return new Promise(async (resolve, reject) =>  {
            // Flag to track if the consumer is running   
            try {
                // Start the consumer if it's not already running
                    await cons.run({
                        eachMessage: async ({ topic, partition, message, heartbeat }) => {
                            console.log("hehe")
                            if (topic === topicConsume) {
                                try {
                                    if (message.key && message.key.toString() === user_id) {
                                        const parsedMessage = await JSON.parse(message.value);
                                        cons.disconnect();
                                        resolve(parsedMessage); // Resolve the promise with the message
                                    }
                                } catch (error) {
                                    console.error('Error handling message:', error);
                                    reject(error); // Reject the promise if an error occurs
                                }
                            }
                        }
                    });
                    // setTimeout(() => {
                    //     reject(new Error('Timeout: No response received within 1 second'));
                    // }, 20000);
                    //consumerRunning = true; // Set the flag to indicate the consumer is running
            } catch (error) {
                console.error('Error in getOrderResponse:', error);
                reject(error); // Reject the promise if an error occurs
            } 
        });
    }
    
    async verifyUserWallet(user_id, order_total, orderKey){
        try {
            // Execute SQL query to retrieve the user's wallet balance
            console.log("hehe")
            const query = `
                DECLARE
                    v_result BOOLEAN;
                BEGIN
                    v_result := verify_wallet_user(:user_id, :order_total);
                    :output := CASE WHEN v_result THEN 'true' ELSE 'false' END;
                END;
            `;

            const bindVars = {
                user_id: { dir: oracledb.BIND_IN, val: user_id },
                order_total: { dir: oracledb.BIND_IN, val: order_total },
                output: { dir: oracledb.BIND_OUT, type: oracledb.STRING }
            };
            
            const options = {
                outFormat: oracledb.OUT_FORMAT_OBJECT,
                // autoCommit: false
            };
             
            const result = await this.OracleClient.execute(query, bindVars, options);
            const output = JSON.parse(result.outBinds.output);
            console.log("Result: ", output);
            // // Extract the wallet balance from the query result
            // const walletBalance = result.rows[0].AMOUNT;
            // // Check if the user's wallet balance is sufficient for the order total
            // const isBalanceSufficient = walletBalance >= order_total;
                // this.OracleClient.rollback();
            await this.ProduceMessage(
                PAYMENT_RESPONSE, 
                {
                    isBalanceSufficient: output
                },
                orderKey
            )

        } catch (error) {
            console.error('Error verifying user wallet:', error);
            throw error;
        }
    }
    
    async SubscribeEvents() {
        await this.initializeDB();
        console.log('CustomerCommunication initialized');
    }

    async ProduceMessage(topic, payload, key){
        if (key) {
            await this.producer.send({
                topic: topic,
                messages: [
                    {
                        key:key,
                        value: JSON.stringify(payload)
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
module.exports = CustomerCommunication;