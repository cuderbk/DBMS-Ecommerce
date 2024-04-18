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
    ORDER_CREATE_RESPONSE
    } = require('../config/index');

class CustomerService{
    // update database prior to del cache
    constructor() {
        this.initializeDB();
        this.consumer = kafka.consumer({ groupId: CONSUMER_GROUP });
        this.producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });
        console.log('CustomerService initialized');
    }
    async initializeDB() {
        try {
            this.RedisClient = await redis.createClient({
                legacyMode: true
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
    }
    async checkOutOrder(user_id, product_list, total_original_price, total_final_price) {
        //
        // productlsit = [
        //     {
        //         product_item_id: 1,
        //         quantity: 2
        //     },
        //     {
        //         product_item_id: 3,
        //         quantity 1
        //     },
        // ]
        try {


            // Produce a message with productids to indicate order creation
            const checkOutStatus = 'Processing'; // Create Paid Shipped
            const orderPayload = {
                user_id: user_id,
                product_list: product_list, // Array of productids
                order_orginial_total: total_original_price,
                order_final_total: total_final_price,
                status: checkOutStatus
            };

            await this.ProduceMessage(ORDER_CREATE_REQUEST, orderPayload);


            console.log('Order checked out processing');
            return FormateData({message: "success"})
        } catch (error) {
            console.error('Error checking out order:', error);
            throw error;
        }
    }
    async getUserCart(userId) {
        try {
            // Fetch user's cart details from Cassandra
            // Check if the user's cart exists in Redis
            const cartKey = `cart:${userId}`;

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
                    const productResult = await this.CassClient.execute(productQuery, [userId], { prepare: true });
                
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
    
    async SubscribeEvents() {
        try {
            // Check if this.consumer is defined before connecting
            if (!this.consumer) {
                throw new Error('Consumer is not initialized');
            }
            await this.consumer.connect();
            await this.consumer.subscribe({
                topics: [ORDER_CREATE_RESPONSE],
                fromBeginning: true
            });
            await this.consumer.run({
                eachMessage: ({ topic, partition, message }) => {
                    // Handle messages
                    if(topic == ORDER_CREATE_RESPONSE){
                        const order_response = JSON.parse(message.value)
                        console.log(order_response)
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