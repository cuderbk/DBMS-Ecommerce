const {getCassClient, getClientOracle} = require('../database/index');
const {getRedis}  = require('..//database/init.redis');
const cassandra = require('cassandra-driver');
const oracledb = require("oracledb");
const redis = require('redis');
const { v4: uuidv4 } = require("uuid");


const { FormateData, GeneratePassword, GenerateSalt, GenerateSignature, ValidatePassword } = require('../utils');

const { order } = require('../../../order/src/api/order');

class CustomerService{
    // update database prior to del cache
    constructor() {
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
        this.OracleClient = await getClientOracle();
        console.log("Ready");
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
    

    async AddNewAddress(id,userInputs){
        
        const { street, postalCode, city,country} = userInputs;
    
        const addressResult = await this.OracleClient.CreateAddress({ id, street, postalCode, city,country})

        return FormateData(addressResult);
    }

    async GetProfile(id){
        console.log(id)
        const customerFindQuery = `SELECT * FROM site_user where Id = :id`;
        const existingCustomer = await this.OracleClient.execute(customerFindQuery,
            {
                id: id
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT });
        const response = {
            userId: existingCustomer.rows[0].ID,
            email: existingCustomer.rows[0].EMAIL_ADDRESS,
            full_name: existingCustomer.rows[0].FIRST_NAME + ' ' + existingCustomer.rows[0].LAST_NAME,
            phone_number: existingCustomer.rows[0].PHONE_NUMBER,
            shipping_address: {
                address: "123 asd",
                city: "sai gon",
                state: "123state",
                country: "viet name",
                zip: "123456",
            }
        }
        return FormateData(response);
    }
    async getUserWallet(id){
        try {
            const query = `select wallet_balance from user_wallet where user_id = :user_id`
            const binds = {
                user_id: id
            }
            const result = await this.OracleClient.execute(
                query,
                binds,
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            return FormateData(result.rows[0]);
        } catch (error) {
            throw error
        }
    }
}
module.exports = CustomerService;