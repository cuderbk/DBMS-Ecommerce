const { FormateData } = require("../utils");
const {getCassClient, getClientOracle} = require('../database/index');
const cassandra = require('cassandra-driver');
const oracledb = require("oracledb")
const redis = require('redis');
const kafka = require('./kafkaService/kafkaConfig');
const {Partitioners} = require('kafkajs');
const {PRODUCT_GROUP,
        ORDER_CREATED,
        PRODUCT_UPDATED,
        PRODUCT_VERIFY,
        PRODUCT_RESPONSE,
    } = require('../config/index');
// All Business logic will be here
class ProductCommunication {

    constructor() {
        this.initilizeDB();
        this.consumer = kafka.consumer({ groupId: PRODUCT_GROUP });
        this.producer = kafka.producer({  
            createPartitioner: Partitioners.LegacyPartitioner,
            sessionTimeout: 60000, });
        console.log('Product Service initialized');
        this.orderResponseConsumer = kafka.consumer({ 
            groupId: "PRO",
            heartbeatInterval: 1000, // should be lower than sessionTimeout
            sessionTimeout: 10000,  });
    }
    async initilizeDB(){
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
        this.OracleClient =await getClientOracle();
        await this.orderResponseConsumer.connect();
        await this.orderResponseConsumer.subscribe({
            topics: ['ORDER_COMMAND_REQUEST'],
            // fromBeginning: true
        });
    }
    async verifyProductAvailability(product_list, orderKey){
        // Extract product_item_id from cartResult
        console.log(orderKey)
        const keyName = 'product:1'
        const getKey = await this.exists(keyName)
        if(!getKey){    
            const productQuery = `SELECT id, quantity_in_stock FROM products_retrieve_view`;

            // Execute the SQL query
            const productResult = await this.OracleClient.execute(
                productQuery, 
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            productResult.rows.forEach(product => {
                    const keyProduct = `product:${product.ID}`
                    this.set(keyProduct, product.QUANTITY_IN_STOCK)
                }
            )
        }

        try {
            // await this.looseVerifyProduct(product_list, orderKey)
            await this.strictVerifyProduct(product_list, orderKey)
        } catch (error) {
            console.log(error)   
        }

        return {message: "hehe"}
    }
    async looseVerifyProduct(product_list, orderKey){
        let insufCount =0;
        const insufficientProducts = await Promise.all(product_list.map(async product => {
            const productKey = `product:${product.product_item_id}`;   
            await this.RedisClient.watch(productKey);
            const multi = await this.RedisClient.multi();
            await multi.get(productKey)  
            await multi.decrby(productKey, product.quantity);
            await multi.exec();       
            const quantityInStock = await this.get(productKey);
            console.log(`After decrease product ${product.product_item_id}: `, quantityInStock);
            // console.log(`Before decrease product ${product.product_item_id}: `,quantityInStock)
            if (quantityInStock < 0) {
                console.error(`Insufficient quantity in stock for product with ID ${product.product_item_id}`);
                insufCount +=1;
                // Rollback transaction
                await multi.discard()
                return {
                    product_item_id: product.product_item_id,
                    quantity_in_stock: quantityInStock,
                    status: 'Insufficient'
                };
            } else {
                // Queue decrement command in the transaction
                return null;
                // return {
                //     product_item_id: product.product_item_id,
                //     quantity_in_stock: quantityInStock,
                //     status: 'Sufficient'
                // };
            }
        }))
        // console.log("After decrease product 1 ", await this.get('product:1'));
        // console.log("After decrease product 3 ", await this.get('product:3'));
        // this.ProduceMessage(
        //     PRODUCT_RESPONSE, 
        //     { 
        //         type: 'OK',
        //         status: 'Orderable'
        //     },
        //     orderKey
        // )
        if (insufCount > 0) {
            console.log("Rollbacked")
            console.log(insufficientProducts)
            // await multi.discard()
            // await isolatedClient.unwatch();
        }
        else{
            console.log("Orderable")
        }
    }
    async strictVerifyProduct(product_list, orderKey){
        let insufCount =0;
        const listProductKey = ['product:1','product:2']
        await this.RedisClient.executeIsolated(async isolatedClient=>{
            await isolatedClient.watch(listProductKey);
            const multi = await isolatedClient.multi();
            const insufficientProducts = await Promise.all(product_list.map(async product => {
                
                const productKey = `product:${product.product_item_id}`;
            
                const quantityInStock = await this.get(productKey);
                console.log(`Before decrease product ${product.product_item_id}: `, quantityInStock);
                // console.log(`Before decrease product ${product.product_item_id}: `,quantityInStock)
                if (quantityInStock < product.quantity) {
                    console.error(`Insufficient quantity in stock for product with ID ${product.product_item_id}`);
                    insufCount +=1;
                    // Rollback transaction
                    return {
                        product_item_id: product.product_item_id,
                        quantity_in_stock: quantityInStock,
                        status: 'Insufficient'
                    };
                } else {
                    // Queue decrement command in the transaction
                    await multi.decrby(productKey, product.quantity);
                    return {
                        product_item_id: product.product_item_id,
                        quantity_in_stock: quantityInStock,
                        status: 'Sufficient'
                    };
                }
            }));
            
            // Execute the transaction
            if (insufCount > 0) {
                console.log("Rollbacked")
                console.log(insufficientProducts)
                await multi.discard()
                // await isolatedClient.unwatch();
                await this.ProduceMessage(
                    PRODUCT_RESPONSE, 
                    { 
                        status: 'InOrderable',
                        insufficient_products: insufficientProducts
                    },
                    orderKey
                )
            }
            else{
                await multi.exec();
                console.log("Orderable")
                await this.ProduceMessage(
                    PRODUCT_RESPONSE, 
                    { 
                        type: 'OK',
                        status: 'Orderable'
                    },
                    orderKey
                )
            }
        })
        try {
            const response = await this.orderCommandRequest(this.orderResponseConsumer, 'ORDER_COMMAND_REQUEST', orderKey)
            if(response.command === 'rollback'){
                await product_list.map(async product => {
                    // console.log(product)
                    // const multi = await this.RedisClient.multi();
                    const productKey = `product:${product.product_item_id}`;
                    await this.incrby(productKey, product.quantity);
                    // await multi.exec();
                })
            }
            else{
                // update into oracle
                console.log("hehe")
                await product_list.map(async product => {
                    const query = `update product_item set quantity_in_stock = quantity_in_stock - :quantity where id = :productID`
                    await this.OracleClient.execute(query, [product.quantity, product.product_item_id]);
                    await this.OracleClient.commit();
                })
            }
            await this.orderResponseConsumer.disconnect();
        } catch (error) {
            console.log(error)
        }
    }
    async calculateNewCartSubtotal(currentSubtotal, productPrice, quantity) {
        const totalPrice = productPrice * quantity;
        const newSubtotal = currentSubtotal + totalPrice;
        return newSubtotal;
    }
    async orderCommandRequest(cons, topicConsume, orderKey){
        return new Promise(async (resolve, reject) =>  {
            // Flag to track if the consumer is running   
            try {
                // Start the consumer if it's not already running
                    await cons.run({
                        eachMessage: async ({ topic, partition, message, heartbeat }) => {
                            if (topic === topicConsume) {
                                try {
                                    if (message.key && message.key.toString() === orderKey) {
                                        const parsedMessage = await JSON.parse(message.value);
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
    async SubscribeEvents() {
        try {
            // Check if this.consumer is defined before connecting
            if (!this.consumer) {
                throw new Error('Consumer is not initialized');
            }
            await this.consumer.connect();
            await this.consumer.subscribe({
                topics: [ORDER_CREATED, PRODUCT_VERIFY],
                // fromBeginning: true
            });
            await this.consumer.run({
                eachMessage: ({ topic, partition, message}) => {
                    if (topic == ORDER_CREATED){
                            // Process order message
                            const product_list = JSON.parse(message.value).product_list
                            // Update product after order created
                            // hdel from user cart
                            // update table cart_products
                            // update table product_item
                            console.log(product_list);
                    }
                    if (topic == PRODUCT_VERIFY){
                        const product_list = JSON.parse(message.value).product_list
                        if(message.key){
                            this.verifyProductAvailability(product_list, message.key.toString());
                        }
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
    async get(key)  {
        return new Promise((resolve, reject) => {
            this.RedisClient.get(key, (err, result) => {
                if(err){
                    return reject(err)
                }
                resolve(result)
            })
        })
    }
   async set(key, value) {
        return new Promise((resolve, reject) => {
            this.RedisClient.set(key,  value, (err, result) => {
                if(err){
                    return reject(err)
                }
                resolve(result)
            })
        })
    }
    
    async incrby(key,  value) {
        return new Promise((resolve, reject) => {
            this.RedisClient.incrby(key,  value, (err, result) => {
                if(err){
                    return reject(err)
                }
                resolve(result)
            })
        })
    }
    async decrby(key,  value) {
        return new Promise((resolve, reject) => {
            this.RedisClient.decrby(key,  value, (err, result) => {
                if(err){
                    return reject(err)
                }
                resolve(result)
            })
        })
    }
    async exists(key) {
        return new Promise((resolve, reject) => {
            this.RedisClient.exists(key, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });
    }; 
    async hgetall(key) {
        return new Promise((resolve, reject) => {
            this.RedisClient.hGetAll(key, (err, result) => {
                if(err){
                    return reject(err)
                }
                resolve(result)
            })
        })
    }
}
module.exports = ProductCommunication;