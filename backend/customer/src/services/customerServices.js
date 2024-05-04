const {getCassClient, getClientOracle} = require('../database/index');
const {getRedis}  = require('..//database/init.redis');
const cassandra = require('cassandra-driver');
const oracledb = require("oracledb");
const redis = require('redis');
const { v4: uuidv4 } = require("uuid");
const kafka = require('./kafkaService/kafkaConfig');
const {Partitioners} = require('kafkajs');

const { FormateData, GeneratePassword, GenerateSalt, GenerateSignature, ValidatePassword } = require('../utils');
const {CONSUMER_GROUP, 
    ORDER_CREATE_REQUEST, 
    ORDER_CREATE_RESPONSE,
    PAYMENT_VERIFY,
    PAYMENT_RESPONSE,
    PAYMENT_COMMITTED,
    } = require('../config/index');
const { order } = require('../../../order/src/api/order');

class CustomerService{
    // update database prior to del cache
    constructor() {
        this.consumer = kafka.consumer({ 
            groupId: CONSUMER_GROUP,
            heartbeatInterval: 1000, // should be lower than sessionTimeout
            sessionTimeout: 60000, });
        this.orderResponseCusConsumer = kafka.consumer({ 
            groupId: "CUS",
            heartbeatInterval: 1000, // should be lower than sessionTimeout
            sessionTimeout: 10000,  });

        this.orderResponseWalConsumer = kafka.consumer({ 
            groupId: "WAL",
            heartbeatInterval: 1000, // should be lower than sessionTimeout
            sessionTimeout: 10000,  });
        this.producer = kafka.producer({  
            createPartitioner: Partitioners.LegacyPartitioner,
            transactionTimeout: 30000,
            allowAutoTopicCreation: true
         });
         this.admin = kafka.admin();
         this.initializeDB();
        console.log('CustomerService initialized');
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
        this.OracleClient =await getClientOracle();
        
        await this.consumer.connect();

        await this.orderResponseCusConsumer.connect();
        await this.orderResponseCusConsumer.subscribe({
            topics: [ORDER_CREATE_RESPONSE],
            fromBeginning: true
        });
        await this.orderResponseWalConsumer.connect();
        await this.orderResponseWalConsumer.subscribe({
            topics: [ORDER_CREATE_RESPONSE],
            // fromBeginning: true
        });
        console.log("Ready");
    }
    async checkOutOrder(user_id, product_list, total_original_price, total_final_price) {
        try {
            const currentTimestamp = Date.now()
            // // Produce a message with productids to indicate order creation
            const checkOutStatus = 'Processing'; // Create Paid Shipped
            const orderPayload = {
                user_id: user_id,
                product_list: product_list, // Array of productids
                payment_type: "Wallet",
                order_final_total: total_final_price,
                status: checkOutStatus
            };
            const crypto = require("crypto");

            const orderKey = crypto.randomBytes(16).toString("hex");
            await this.ProduceMessage(ORDER_CREATE_REQUEST, orderPayload, orderKey);
            
            // await this.consumer.disconnect()
            try {
                // Check if this.orderResponseConsumer is defined before connecting
                if (!this.orderResponseCusConsumer) {
                    throw new Error('Consumer is not initialized');
                }
                // await this.orderResponseConsumer.run();
                const response = await this.getOrderResponse(this.orderResponseCusConsumer, "CUS", orderKey, ORDER_CREATE_RESPONSE)
                console.log("checkout ", response)
                if(response.status == 'CREATED'){
                    return FormateData({message: "success"})
                }
                else{
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
    async getUserCart(user_id) {
        try {
            // Fetch user's cart details from Cassandra
            // Check if the user's cart exists in Redis
            const cartKey = `cart:${user_id}`;

            // Wrap the callback-based hGetAll in a Promise
            const cart = await new Promise((resolve, reject) => { 
                this.RedisClient.hGetAll(cartKey, async (err, data) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                let cartResult = [];
                if (!JSON.stringify(data)) {
                    // Fetch user's cart details from Cassandra
                    console.log('Fetching cart from Cassandra');
                    const productQuery = 'SELECT product_item_id, quantity FROM ecommerce.cart_products WHERE user_id = ?';
                    const productResult = await this.CassClient.execute(productQuery, [user_id], { prepare: true });
                
                    // Transform Cassandra result into cart object
                    cartResult = productResult.rows.map(product => {
                        const productId = product.product_item_id;
                        const quantity = product.quantity;
                        // Store cart item in Redis for caching
                        this.RedisClient.hset(cartKey, `product:${productId}`, quantity.toString());
                        // Return cart item object
                        return {
                            product_item_id: productId,
                            quantity_request: Number(quantity)
                        };
                    });
                } else {
                    const resultObject = JSON.parse(JSON.stringify(data));
                    // Construct cartResult from resultObject
                    cartResult = Object.entries(resultObject).map(([key, value]) => {
                        const productId = key.split(':')[1]; // Extract the product ID from the key
                        // Return cart item object
                        return {
                            product_item_id: productId,
                            quantity_request: Number(value)
                        };
                    });
                }
                                // Extract product_item_id from cartResult
                const productIds = cartResult.map(product => product.product_item_id);

                // Dynamically generate the IN clause for the query
                const placeholders = productIds.map((id, index) => `:id${index}`).join(',');
                const binds = {};
                productIds.forEach((id, index) => {
                    binds[`id${index}`] = id;
                });

                // Construct the SQL query
                const productQuery = `SELECT * FROM products_with_promotion_materialize_view WHERE id IN (${placeholders})`;

                // Execute the SQL query
                const productResult = await this.OracleClient.execute(
                    productQuery, 
                    binds,
                    { outFormat: oracledb.OUT_FORMAT_OBJECT }
                );
                // // Process the results of the SQL query
                const cartItems = productResult.rows.map(product => {
                    const cartItem = cartResult.find(item => item.product_item_id === String(product.ID));
                    const quantityInStock = product.QUANTITY_IN_STOCK;
                    let status = 'Available';

                    if (quantityInStock === 0) {
                        console.error(`Product item with ID ${product_item.id} not found in inventory`);
                        status = 'Unavailable';
                    } else if (quantityInStock < cartItem.quantity_request) {
                        console.error(`Insufficient quantity in stock for product with ID ${product.product_item_id}`);
                        status = 'Insufficient';
                    }

                    return {
                        product_item_id: product.ID,
                        productid: product.PRODUCT_ID,
                        product_description: product.DESCRIPTION,
                        product_name: product.NAME,
                        product_price: product.PRICE,
                        product_image: product.IMAGE_MAIN,
                        quantity_request: cartItem.quantity_request,
                        quantity_in_stock: quantityInStock,
                        total_price: product.PRICE * cartItem.quantity_request,
                        product_status: status,
                        promotion_name: product.PROMOTION_NAME,
                        promotion_description: product.PROMOTION_DESCRIPTION,
                        discount_rate: product.DISCOUNT_RATE,
                        promotion_status: product.PROMOTION_STATUS,
                        days_left: product.DATE_LEFT
                    };
                });

                console.log('User cart retrieved successfully:');
                resolve(cartItems);
            });
        });

    return FormateData(cart);
        } catch (error) {
            console.error('Error retrieving user cart:', error);
            throw error;
        }
    }
    async getOrderResponse(cons, group_name, user_id, topicConsume) {
        // cons.resume([{ORDER_CREATE_RESPONSE}])
        return new Promise(async (resolve, reject) =>  {
            // Flag to track if the consumer is running   
            try {
                // Start the consumer if it's not already running
                    await cons.run({
                        eachMessage: async ({ topic, partition, message, heartbeat }) => {
                            if (topic === topicConsume) {
                                try {
                                    if (message.key && message.key.toString() === user_id) {
                                        const parsedMessage = await JSON.parse(message.value);
                                        this.orderResponseCusConsumer.disconnect();
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
            console.log("Wallet Verify")
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
            this.OracleClient.commit();
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
        try {
            await this.consumer.subscribe({
                topics: [PAYMENT_VERIFY],
                fromBeginning: true
            });
            await this.consumer.run({
                eachMessage: async ({ topic, partition, message, heartbeat }) => {
                    if (topic === PAYMENT_VERIFY) {
                        try {
                            if (message.key) {
                                const parsedMessage = await JSON.parse(message.value);
                                await this.verifyUserWallet(Number(parsedMessage.user_id), Number(parsedMessage.order_total), message.key.toString());
                            }
                        } catch (error) {
                            console.error('Error handling message:', error);
                            reject(error); // Reject the promise if an error occurs
                        }
                    }
                }
            });
            console.log("Subscribed to events");
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
    async SignIn(userInputs){

        const { email, password } = userInputs;
        
        const customerFindQuery = `SELECT * FROM site_user where email_address = :email`;
        const existingCustomer = await this.OracleClient.execute(customerFindQuery,
            {
                email: email
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if(existingCustomer){
            console.log(existingCustomer.rows[0])
            const validPassword = await ValidatePassword(password, existingCustomer.rows[0].PASSWORD, existingCustomer.rows[0].SALT);
            if(validPassword){
                const token = await GenerateSignature({ email: existingCustomer.email, id: existingCustomer.id});
                return FormateData({id: existingCustomer.id, token });
            }
        }

        return FormateData(null);
    }

    async SignUp(userInputs){
        
        const { email, phone, image, password, first_name, last_name } = userInputs;
        
        // create salt
        let salt = await GenerateSalt();
        
        let userPassword = await GeneratePassword(password, salt);

        const customerCreateQuery = `INSERT INTO site_user 
        (email_address, phone_number, picture_url, password, last_name, first_name, salt) 
        VALUES (:email, :phone, :image, :password, :last_name, :first_name, :salt)`;
        const params = { 
            email: email,
            phone: phone,
            image: image,
            password: userPassword,
            last_name: last_name,
            first_name: first_name,
            salt: salt};
        const existingCustomer = await this.OracleClient.execute(
            customerCreateQuery,
            params,
            // { autoCommit: false },
            { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(existingCustomer);
        const token = await GenerateSignature({ email: email, phone: phone});
        await this.OracleClient.commit(); 
        return FormateData({id: existingCustomer.id, token });
        // return FormateData({id: 1})
    }

    async AddNewAddress(id,userInputs){
        
        const { street, postalCode, city,country} = userInputs;
    
        const addressResult = await this.OracleClient.CreateAddress({ id, street, postalCode, city,country})

        return FormateData(addressResult);
    }

    async GetProfile(id){

        const existingCustomer = await this.OracleClient.FindCustomerById({id});
        return FormateData(existingCustomer);
    }
}
module.exports = CustomerService;