const {getCassClient, getClientOracle} = require('../database/index');
const cassandra = require('cassandra-driver');
const oracledb = require("oracledb")
const { v4: uuidv4 } = require("uuid");
const kafka = require('./kafkaService/kafkaConfig');
const {Partitioners} = require('kafkajs');
const { FormateData, GeneratePassword, GenerateSalt, GenerateSignature, ValidatePassword } = require('../utils');
const {CONSUMER_GROUP, 
    ORDER_CREATE_REQUEST, 
    ORDER_CREATE_RESPONSE
    } = require('../config/index');

class CustomerService{
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
    async checkOutOrder(user_id) {
        try {
            // const cartQuery = 'select cart_subtotal from ecommerce.cart_products where user_id = ? limit 1';
            // const params = { user_id: user_id };
            //const cartTotalResult = await this.CassClient.execute(cartQuery, params, { prepare: true });
            // console.log(cartTotalResult.rows[0]);
            const cartProducts = await this.getUserCart(user_id);
            const productIds = cartProducts.map(product => product.product_id);

            // Produce a message with product_ids to indicate order creation
            const checkOutStatus = 'Processing'; // Create Paid Shipped
            const orderPayload = {
                user_id: user_id,
                product_ids: productIds, // Array of product_ids
                order_total: cartProducts[0].cart_subtotal,
                status: checkOutStatus
            };

            await this.ProduceMessage(ORDER_CREATE_REQUEST, orderPayload);


            console.log('Order checked out processing');
        } catch (error) {
            console.error('Error checking out order:', error);
            throw error;
        }
    }
    async getUserCart(user_id) {
        try {
            // Fetch user's cart details from Cassandra
            const productQuery = 'SELECT * FROM ecommerce.cart_products WHERE user_id = :user_id';
            const params = { user_id: user_id };
            const productResult = await this.CassClient.execute(productQuery, params, { prepare: true });
            
            const productIds = productResult.rows.map(product => product.product_id);
            
            // Dynamically generate the IN clause for the query
            const placeholders = productIds.map((id, index) => `:id${index}`).join(',');
            const binds = {};
            productIds.forEach((id, index) => {
                binds[`id${index}`] = id;
            });
            
            const productStatusQuery = `SELECT id, quantity_in_stock FROM product_item WHERE product_id IN (${placeholders})`;
            const productStatusResult = await this.oracleClient.execute(productStatusQuery, binds);

    
            // // Create a map to store product statuses for efficient lookup
            const productStatusMap = new Map();
            productStatusResult.rows.forEach(row => {
                productStatusMap.set(row.id, row.quantity_in_stock);
            });
    
            // Merge product statuses into cartItems
            const cartItems = productResult.rows.map(product => {
                const quantityInStock = productStatusMap.get(product.product_id);
                let status = 'Available';
    
                if (quantityInStock === 0) {
                    console.error(`Product item with ID ${product.product_id} not found in inventory`);
                    status = 'Unavailable';
                } else if (quantityInStock < product.quantity) {
                    console.error(`Insufficient quantity in stock for product with ID ${product.product_id}`);
                    status = 'Insufficient';
                }
    
                return {
                    product_timestamp: product.product_timestamp,
                    product_id: product.product_id,
                    product_description: product.product_description,
                    product_name: product.product_name,
                    product_price: product.product_price,
                    quantity: product.quantity,
                    total_price: product.cart_subtotal,
                    product_status: status
                };
            });
    
            console.log('User cart retrieved successfully:', cartItems);
            return cartItems; // Return cart items
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
    async SignIn(userInputs){

        const { email, password } = userInputs;
        
        const existingCustomer = await this.oracleClient.FindCustomer({ email});

        if(existingCustomer){
            
            const validPassword = await ValidatePassword(password, existingCustomer.password, existingCustomer.salt);
            if(validPassword){
                const token = await GenerateSignature({ email: existingCustomer.email, _id: existingCustomer._id});
                return FormateData({id: existingCustomer._id, token });
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
        const params = { email: email,
                         phone: phone,
                         image: image,
                         last_name: last_name,
                         first_name: first_name };
        const existingCustomer = await this.oracleClient.execute(customerCreateQuery,[email, phone, image,userPassword, last_name, first_name, salt],{ outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        const token = await GenerateSignature({ email: email, phone: phone});
        return FormateData({id: existingCustomer.id, token });

    }

    async AddNewAddress(_id,userInputs){
        
        const { street, postalCode, city,country} = userInputs;
    
        const addressResult = await this.oracleClient.CreateAddress({ _id, street, postalCode, city,country})

        return FormateData(addressResult);
    }

    async GetProfile(id){

        const existingCustomer = await this.oracleClient.FindCustomerById({id});
        return FormateData(existingCustomer);
    }
}
module.exports = CustomerService;