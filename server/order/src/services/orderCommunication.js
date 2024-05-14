const {getCassClient, getClientOracle} = require('../database/index');
const cassandra = require('cassandra-driver');
const oracledb = require("oracledb")
const { v4: uuidv4 } = require("uuid");
const kafka = require('./kafkaService/kafkaConfig');
const {Partitioners} = require('kafkajs');

const {CONSUMER_GROUP, 
    ORDER_CREATE_REQUEST, 
    ORDER_CREATE_RESPONSE,
    PRODUCT_VERIFY,
    PRODUCT_RESPONSE,
    PAYMENT_VERIFY,
    PAYMENT_RESPONSE,
    ORDER_CREATED
    } = require('../config/index');
const { order } = require('../api/order');

class OrderCommunication{
    constructor() {
        this.consumer = kafka.consumer({ groupId: CONSUMER_GROUP, heartbeatInterval: 10000, // should be lower than sessionTimeout
        sessionTimeout: 60000, });
        this.producer = kafka.producer({ 
            createPartitioner: Partitioners.LegacyPartitioner,
            allowAutoTopicCreation: true,
            transactionTimeout: 60000
        });
        
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
        this.OracleClient =await getClientOracle();
        await this.producer.connect();
        if (!this.consumer) {
            throw new Error('Consumer is not initialized');
        }
        await this.consumer.connect();
        await this.consumer.subscribe({
            topics: [ORDER_CREATE_REQUEST],
            //fromBeginning: true
        });

    }
    async processOrderMessage(data, orderKey) {
        try {
            // 1. Check product_item availability
            // Iterate over each product in the product_list
            const productResponse = await this.checkProductsAvailability(data.product_list, orderKey);
            if(productResponse.status === 'InOrderable'){
                await this.ProduceMessage(ORDER_CREATE_RESPONSE, productResponse, orderKey);
                return ;
            }
            // 2. Verify user's wallet balance if payment type is 'Wallet'
            if (data.payment_type === 'Wallet') {
                console.log("Payment")
                const walletBalance = await this.verifyUserWallet(data.user_id, data.order_final_total, orderKey);
                console.log(walletBalance)
                if (!walletBalance.isBalanceSufficient) {
                    const orderResponse = {
                        type: "WalletNotEnough",
                        status: "FAILED"
                    };
                    await this.ProduceMessage(ORDER_CREATE_RESPONSE, orderResponse, orderKey); 

                    await this.ProduceMessage('ORDER_COMMAND_REQUEST', {command: "rollback"}, orderKey); 
                    //throw new Error(`Products ${product.product_item_id} are not sufficient`);
                    return ;
                }
                else{
                    await this.ProduceMessage('ORDER_COMMAND_REQUEST', {command: "commit"}, orderKey); 
                }
            }
            const orderId = await this.createOrder(data)
            const orderResponse = {
                order_id: orderId,
                status: "CREATED"
            };

            // insert into shop_order
            // insert into redis

            await this.ProduceMessage(ORDER_CREATE_RESPONSE, orderResponse, orderKey);
            //socket here
            console.log("Order processed successfully");
            return {message:"success"}
        } catch (error) {
            console.error("Error processing order:", error);
            // Handle the error appropriately
            throw error;
        }
    }
    async createOrder(data) {
        try {
            const orderStatus = 2;
            const paid = 1;
            // with data.product_list = [
            //     { product_item_id: 1, quantity: 4, price: 2000 },
            //     { product_item_id: 3, quantity: 8, price: 400 }
            //   ]
            const orderLineType = {
                name: 'ORDER_LINE_TYPE',
                properties: {
                    PRODUCT_ITEM_ID: { type: oracledb.NUMBER },
                    QUANTITY: { type: oracledb.NUMBER },
                    PRICE: { type: oracledb.NUMBER }
                }
            };
    
            // Prepare the order lines as an array of Oracle objects
            const orderLines = data.product_list.map(item => ({
                PRODUCT_ITEM_ID: item.product_item_id,
                QUANTITY: item.quantity,
                PRICE: item.price
            }));
            const bindVars = {
                p_user_id: data.user_id,
                p_payment_method: data.payment_type,
                p_shipping_address: data.shipping_address,
                p_shipping_method_id: data.shipping_method_id,
                p_order_total: data.order_final_total,
                p_order_status: orderStatus,
                p_order_lines: {
                    val: orderLines, type:'ORDER_LINE_LIST' },
                p_paid: paid,
                v_order_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            };
            const result = await this.OracleClient.execute(
                `BEGIN
                Create_Order(:p_user_id, :p_payment_method, :p_shipping_address, :p_shipping_method_id, :p_order_total,
                    :p_order_status, :p_order_lines, :p_paid, :v_order_id);
                END;`,
                bindVars,
                { autoCommit: true }
            );
            // console.log(result)
            const orderId = result.outBinds.v_order_id;
            return orderId;
        } catch (error) {
            console.error("Error:", error);
            throw error;
        }
    }
    
    async checkProductsAvailability(product_list, orderKey) {
        console.log("Product")

        await this.ProduceMessage(PRODUCT_VERIFY, 
            { 
              product_list: product_list 
            },
            orderKey
        );
        const productConsumer = kafka.consumer({ groupId: "PRODUCT_GROUP" });
        try {
            // Check if productConsumer is defined before connecting
            if (!productConsumer) {
                throw new Error('Consumer is not initialized');
            }
            await productConsumer.connect();
            await productConsumer.subscribe({
                topics: [PRODUCT_RESPONSE],
                // fromBeginning: true
            });
            // await productConsumer.run();

        } catch (error) {
            await productConsumer.disconnect();
            console.error('Failed to subscribe to events:', error);
            process.exit(1);
        }
        return new Promise(async (resolve, reject) => {
            // Flag to track if the consumer is running   
            try {
                // Start the consumer if it's not already running
                    await productConsumer.run({
                        eachMessage: async ({ topic, partition, message, heartbeat }) => {
                            if (topic === PRODUCT_RESPONSE) {

                                try {
                                    if (message.key && message.key.toString() === orderKey) {
                                        
                                        const parsedMessage = await JSON.parse(message.value);
                                        productConsumer.disconnect();
                                        console.log("Product done")
                                        resolve(parsedMessage); // Resolve the promise with the message
                                    }
                                } catch (error) {
                                    console.error('Error handling message:', error);
                                    reject(error); // Reject the promise if an error occurs
                                }
                            }
                        }
                    });
    
                    //consumerRunning = true; // Set the flag to indicate the consumer is running
            } catch (error) {
                console.error('Error in getOrderResponse:', error);
                reject(error); // Reject the promise if an error occurs
            } 
        });
    } 
    
    async verifyUserWallet(user_id, order_total, orderKey) {

        await this.ProduceMessage(
            PAYMENT_VERIFY,
            {
                user_id: user_id,
                order_total: order_total,
            },
        orderKey) 
        const paymentConsumer = kafka.consumer({ 
            groupId: "PAYMENT_GROUP",
            sessionTimeout: 60000,   
        });
        try {
            // Check if paymentConsumer is defined before connecting
            if (!paymentConsumer) {
                throw new Error('Consumer is not initialized');
            }
            await paymentConsumer.connect();
            await paymentConsumer.subscribe({
                topics: [PAYMENT_RESPONSE],
                // fromBeginning: true
            });
            // await paymentConsumer.run();

        } catch (error) {
            await paymentConsumer.disconnect();
            console.error('Failed to subscribe to events:', error);
            process.exit(1);
        }
        return new Promise(async (resolve, reject) => {
            // Flag to track if the consumer is running   
            try {
                // Start the consumer if it's not already running
                    await paymentConsumer.run({
                        eachMessage: async ({ topic, partition, message }) => {
                            console.log(topic)
                            if (topic === PAYMENT_RESPONSE) {
                                try {
                                    if (message.key && message.key.toString() === orderKey) {
                                        const parsedMessage = await JSON.parse(message.value);
                                        paymentConsumer.disconnect();
                                        console.log("Wallet done")
                                        resolve(parsedMessage); // Resolve the promise with the message
                                    }
                                } catch (error) {
                                    console.error('Error handling message:', error);
                                    reject(error); // Reject the promise if an error occurs
                                }
                            }
                        }
                    });
                    setTimeout(() => {
                        reject(new Error('Timeout: No response received within 1 second'));
                    }, 15000);
                    //consumerRunning = true; // Set the flag to indicate the consumer is running
            } catch (error) {
                console.error('Error in getOrderResponse:', error);
                reject(error); // Reject the promise if an error occurs
            } 
        });
    } 
    async insertOrder(orderData) {
        // Implement logic to insert order details into shop_order table
        // Return the inserted order ID
    }
    
    async insertOrderLineItems(orderId, productList) {
        // Implement logic to insert order line items into order_line table
    }    
    async SubscribeEvents() {
        try {
            // Check if this.consumer is defined before connecting
            await this.initilizeDB();
            await this.consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    // Handle messages
                    // order_status  = ACTIVE, PENDING, PROCESSED, SHIPPED, CANCELLED, RETURNED 
                    if(topic === ORDER_CREATE_REQUEST){
                        const order_detail = JSON.parse(message.value);
                        if(message.key){
                            await this.processOrderMessage(order_detail, message.key.toString());   
                        }
                    }
                    // if(topic == PRODUCT_RESPONSE){
                    //     const productResponse = JSON.parse(message.value)
                    //     console.log(productResponse)
                    // }
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
        if (key) {
            await this.producer.send({
                topic: topic,
                messages: [
                    {
                        key: key,
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
};
module.exports = OrderCommunication;