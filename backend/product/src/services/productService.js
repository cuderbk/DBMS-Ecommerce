const { FormatData } = require("../utils");
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
class ProductService {

    constructor() {
        this.initilizeDB();
        this.consumer = kafka.consumer({ groupId: PRODUCT_GROUP });
        this.producer = kafka.producer({ 
            createPartitioner: Partitioners.LegacyPartitioner,
            sessionTimeout: 60000, });
        console.log('Product Service initialized');
    }
    async initilizeDB(){
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

    async CreateProduct(productInputs) {
        try {
            const { name, description, category_id, product_image, price, SKU, quantity_in_stock, product_item_images } = productInputs;
    
            // Convert product_item_images array to a string with the desired syntax
            const productItemImageList = productInputs.product_item_images.join(',');
    
            // Construct the PL/SQL block to call the Create_Product procedure
            const productInsertQuery =`
                DECLARE
                    v_name VARCHAR2(100) := :v_name;
                    v_description VARCHAR2(255) := :v_description;
                    v_category_id NUMBER := :v_category_id;
                    v_product_image VARCHAR2(255) := :v_product_image;
                    v_price NUMBER := :v_price;
                    v_sku VARCHAR2(50) := :v_sku;
                    v_quantity_in_stock NUMBER := :v_quantity_in_stock;
                    v_product_item_image_list SYS.ODCIVARCHAR2LIST := SYS.ODCIVARCHAR2LIST(:v_product_item_image_list);
                    out_product_id NUMBER;
                BEGIN
                    Create_Product(
                        p_name => v_name,
                        p_description => v_description,
                        p_category_id => v_category_id,
                        p_product_image => v_product_image,
                        p_price => v_price,
                        p_sku => v_sku,
                        p_quantity_in_stock => v_quantity_in_stock,
                        p_product_item_image_list => v_product_item_image_list,
                        out_product_id => out_product_id
                    );
    
                    -- Return the product ID
                    :out_product_id := out_product_id;
                END;
            `;
            
            // Bind the input parameters for the procedure call
            const binds = {
                v_name: name,
                v_description: description,
                v_category_id: category_id,
                v_product_image: product_image,
                v_price: price,
                v_sku: SKU,
                v_quantity_in_stock: quantity_in_stock,
                v_product_item_image_list: productItemImageList,
                out_product_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            };
    
            // Execute the PL/SQL block
            const result = await this.OracleClient.execute(productInsertQuery, binds);
            
            // Return the formatted product data
            const productId = result.outBinds.out_product_id;

            return FormatData({ id: productId});
        } catch (error) {
            console.error('Error creating product:', error);
            // Rollback the transaction in case of an error
            await this.OracleClient.rollback();
            throw error;
        }
    }
    async UpdateProductItem(productInputs){
        // product item, product
        try {
            
        } catch (error) {
            
        }
    }
    async UpdateProduct(productInputs){
        try {
            
        } catch (error) {
            
        }
    }
    async DeleteProductItem(product_item_id){
        try {
            
        } catch (error) {
            
        }
    }
    async DeleteProduct(product_id){
        try {
            
        } catch (error) {
            
        }
    }
    async GetProductsOnSale() {
        try {
            // Retrieve products with related promotion and variation information
            const query = `select * from products_with_available_promotion_materialize_view`;
            const products = await this.OracleClient.execute(query,{},{ outFormat: oracledb.OUT_FORMAT_OBJECT });
            // Return the formatted product data
            const formattedProducts = products.rows.map(product => {
                return{
                    product_item_id: product.ID,
                    name: product.NAME,
                    description: product.DESCRIPTION,
                    category_name: product.CATEGORY_NAME,
                    product_image: product.PRODUCT_IMAGE,
                    price: product.PRICE,
                    quantity_in_stock: product.QUANTITY_IN_STOCK,
                    promotion: {
                        name: product.PROMOTION_NAME,
                        description: product.PROMOTION_DESCRIPTION,
                        discount_rate: product.DISCOUNT_RATE,
                        start_date: product.START_DATE,
                        end_date: product.END_DATE,
                        price_after_discount: product.PRICE_AFTER_DISCOUNT,
                        status: product.PROMOTION_STATUS,
                        date_left: product.DATE_LEFT
                    }
                }
            });
            // Return the formatted product data
            console.log(formattedProducts)
            return FormatData(formattedProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    }
    async GetProducts() {

        try {
            // Retrieve products with related promotion and variation information
            const query = `select * from products_with_promotion_materialize_view`;
            const products = await this.OracleClient.execute(query,[],{ outFormat: oracledb.OUT_FORMAT_OBJECT });
            // Return the formatted product data
            const formattedProducts = products.rows.map(product => {
                return{
                    
                    product_item_id: product.ID,
                    name: product.NAME,
                    description: product.DESCRIPTION,
                    category_name: product.CATEGORY_NAME,
                    product_image: product.PRODUCT_IMAGE,
                    price: product.PRICE,
                    quantity_in_stock: product.QUANTITY_IN_STOCK,
                    promotion: {
                        name: product.PROMOTION_NAME,
                        description: product.PROMOTION_DESCRIPTION,
                        discount_rate: product.DISCOUNT_RATE,
                        start_date: product.START_DATE,
                        end_date: product.END_DATE,
                        price_after_discount: product.PRICE_AFTER_DISCOUNT,
                        status: product.PROMOTION_STATUS,
                        date_left: product.DATE_LEFT
                    }
                }
        });
            // Return the formatted product data
            console.log(formattedProducts)
            return FormatData(formattedProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    }
    async getVariationType(product_id) {
        try {
            // Retrieve variation names from the Oracle database based on product configuration
            const query = `
                SELECT v.id, v.name
                FROM variation v
                JOIN product_configuration pc ON v.id = pc.variation_option_id
                WHERE pc.product_item_id = :pid
            `;
            const variations = await this.OracleClient.execute(query, [product_id],{ outFormat: oracledb.OUT_FORMAT_OBJECT });
    
            // Return the formatted variation data
            return FormatData(variations.rows);
        } catch (error) {
            console.error('Error fetching variation product:', error);
            throw error;
        }
    }
    async getVariationProduct(product_id) {
        try {
            // Retrieve variation names from the Oracle database based on product configuration
            const query = `
            SELECT v.name, vo.value
            FROM variation_option vo
            INNER JOIN variation v on v.id = vo.variation_id
            inner join product_configuration pc on pc.variation_option_id = vo.variation_id
            WHERE pc.product_item_id = :pid
            `;
            const variations = await this.OracleClient.execute(query, [product_id],{ outFormat: oracledb.OUT_FORMAT_OBJECT });
            // Initialize an object to store variations
            const formattedVariations = {};

            // Iterate through the variations result and organize them by name
            for (const variation of variations.rows) {
                const { NAME, VALUE } = variation;
                if (!formattedVariations[NAME]) {
                    formattedVariations[NAME] = [VALUE];
                } else {
                    formattedVariations[NAME].push(VALUE);
                }
            }
            // Return the formatted variation data
            return FormatData(formattedVariations);
        } catch (error) {
            console.error('Error fetching variation product:', error);
            throw error;
        }
    }
    async GetProductDetail(product_id) {

        try {
            // Retrieve products with related promotion and variation information
            const query = `
            SELECT 
                p.*, 
                pi.price,
                pi.quantity_in_stock,
                pr.name AS promotion_name, 
                pr.description AS promotion_description, 
                pr.discount_rate, 
                pr.start_date, 
                pr.end_date,
                (pi.price - (pi.price * pr.discount_rate)) AS price_after_discount,
                    CASE
                        WHEN pr.start_date <= CURRENT_DATE AND pr.end_date > CURRENT_DATE THEN 'Available'
                        WHEN pr.start_date > CURRENT_DATE THEN 'Upcoming'
                        ELSE 'Expired'
                    END AS promotion_status,
                    GREATEST(0,TO_DATE(pr.end_date, 'YYYY-MM-DD')- TO_DATE( CURRENT_DATE, 'YYYY-MM-DD')) AS date_left
                FROM 
                    product p
                inner join product_item pi on p.id = pi.product_id
                LEFT JOIN 
                    promotion_category pc ON p.category_id = pc.category_id
                LEFT JOIN 
                    promotion pr ON pc.promotion_id = pr.id
                WHERE p.id = :pid
            `;
            let product = await this.OracleClient.execute(query,[product_id],{ outFormat: oracledb.OUT_FORMAT_OBJECT });
            product = product.rows[0]
            // Return the formatted product data
            const variationData = await this.getVariationProduct(product_id)
            const formattedProduct = {
                id: product.ID,
                name: product.NAME,
                description: product.DESCRIPTION,
                category_id: product.CATEGORY_ID,
                product_images: [product.PRODUCT_IMAGE],
                price: product.PRICE,
                quantity_in_stock: product.QUANTITY_IN_STOCK,
                promotion: {
                    name: product.PROMOTION_NAME,
                    description: product.PROMOTION_DESCRIPTION,
                    discount_rate: product.DISCOUNT_RATE,
                    start_date: product.START_DATE,
                    end_date: product.END_DATE,
                    price_after_discount: product.PRICE_AFTER_DISCOUNT,
                    status: product.PROMOTION_STATUS,
                    date_left: product.DATE_LEFT
                },
                variations: variationData.data
            }
            // Return the formatted product data
            console.log(formattedProduct)
            return FormatData(formattedProduct);
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    }
    
    async GetProductsByCategory(category) {
        // Retrieve products by category from the Oracle database
        const products = await this.OracleClient.execute(/* SELECT from products table WHERE category = ? */);
        return this.FormatData(products);
    }
    async calculateNewCartSubtotal(currentSubtotal, productPrice, quantity) {
        const totalPrice = productPrice * quantity;
        const newSubtotal = currentSubtotal + totalPrice;
        return newSubtotal;
    }

    async addProductToCart(user_id, product_item_id, quantity) {
        try {
            // Check if the user's cart exists in Redis
            const cartKey = `cart:${user_id}`;
            let cart = await this.RedisClient.hGetAll(cartKey);
            // // If cart doesn't exist in Redis, fetch it from Cassandra and store in Redis
            if (!cart || Object.keys(cart).length === 0) {
                cart = await this.cassClient.getUserCart(user_id);
                await this.RedisClient.hSet(cartKey, cart);
            }
    
            // Check if the product exists in the cart
            // const productQuantity = cart[`product:${product_item_id}`];
            // if (productQuantity) {
            //     // Product exists, update quantity using hincrby
            //     await this.RedisClient.hincrby(cartKey, `product:${product_item_id}`, quantity);
            // } else {
            //     // Product doesn't exist, add it using hSet
            await this.RedisClient.hSet(cartKey, `product:${product_item_id}`, `${quantity}`);
            // }
    
            // Update cart TTL in Redis (optional)
            const result =await this.RedisClient.hGetAll(cartKey, function(err,field, value) {
                if (err) {
                    console.error("error");
                } else {
                    
                    console.log(JSON.stringify(field,null ,2));
                }
           });
            // Write cart changes to Cassandra for synchronization
            // await this.cassClient.updateUserCart(user_id, cart);
    
            return { success: true, message: 'Product added to cart successfully' };
        } catch (error) {
            console.error('Error adding product to cart:', error);
            throw error;
        }
        // try {
        //     // Verify if the requested quantity is available
        //     const stockQuery = 'SELECT quantity_in_stock FROM product_item WHERE id = :pid';
        //     const stockParams = [product_item_id];
        //     const stockResult = await this.OracleClient.execute(stockQuery, stockParams);
    
        //     const availableStock = stockResult.rows[0].quantity_in_stock;
        //     if (quantity > availableStock) {
        //         // Rollback the transaction if the requested quantity exceeds the available stock
        //         // await this.CassClient.execute('ROLLBACK');
        //         throw new Error('Requested quantity exceeds available stock');
        //     } 
        //     //Use REDIS HERRRRRREEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
        //     // Check if the product already exists in the user's cart
        //     const cartQuery = 'SELECT * FROM ecommerce.cart_products WHERE user_id = :user_id AND product_item_id = :product_item_id';
        //     const cartParams = { user_id: user_id, product_item_id: product_item_id };
        //     const cartResult = await this.CassClient.execute(cartQuery, cartParams, { prepare: true });
     
        //     if (cartResult.rows.length > 0) {
        //         // If the product exists, update its quantity in the cart
        //         const updateQuantityQuery = `
        //             UPDATE ecommerce.cart_products 
        //             SET quantity = ?, 
        //                 product_timestamp = ?, 
        //                 cart_subtotal = ? 
        //             WHERE user_id = ? AND product_item_id = ?`;
              
        //         // Calculate the new quantity by adding the existing quantity with the new quantity
        //         const newQuantity = Number(cartResult.rows[0].quantity) + quantity; 
            
        //         // Calculate the new product_timestamp (current timestamp) and cart_subtotal
        //         const productTimestamp =Date.now(); // or use your preferred method to get the current timestamp
        //         const cartSubtotal = await this.calculateNewCartSubtotal(Number(cartResult.rows[0].cart_subtotal), Number(cartResult.rows[0].product_price), quantity);
        //         const updateQuantityParams = [newQuantity, productTimestamp, cartSubtotal, user_id, product_item_id];
            
        //         await this.CassClient.execute(updateQuantityQuery, updateQuantityParams, { prepare: true });
        //     } else {
        //         // If the product does not exist, insert a new record into the cart
        //         const insertQuery = `
        //             INSERT INTO ecommerce.cart_products 
        //             (user_id, product_item_id, quantity, product_timestamp, cart_subtotal, product_name, product_description, product_price) 
        //             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            
        //         // Calculate the new product_timestamp (current timestamp) and cart_subtotal
        //         const productTimestamp = new Date(); // or use your preferred method to get the current timestamp
        //         const cartSubtotal =await this.calculateNewCartSubtotal(1,2,3); // Implement your logic to calculate the cart subtotal
            
        //         const insertParams = [user_id, product_item_id, quantity, productTimestamp, cartSubtotal, product_name, product_description, product_price];
            
        //         await this.CassClient.execute(insertQuery, insertParams, { prepare: true });
        //     }
            
        //     // cassandra driver use await as commit that ensure update must completed
    
        //     return { success: true };
        // } catch (error) {
        //     console.error('Error adding product to cart:', error);
        //     throw error;
        // }
    }
    async verifyProductAvailability(product_list, orderKey){
        // Extract product_item_id from cartResult
        const productIds = product_list.map(product => product.product_item_id);

        // Dynamically generate the IN clause for the query
        const placeholders = productIds.map((id, index) => `:id${index}`).join(',');
        const binds = {};
        productIds.forEach((id, index) => {
            binds[`id${index}`] = id;
        });
        const productQuery = `SELECT id, quantity_in_stock FROM products_retrieve_materialize_view WHERE id IN (${placeholders})`;

        // Execute the SQL query
        const productResult = await this.OracleClient.execute(
            productQuery, 
            binds,
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const insufficientProducts = [];

        productResult.rows.forEach(product => {
            const cartItem = product_list.find(item => item.product_item_id === product.ID);
            if (!cartItem) {
                console.error(`Product with ID ${product.ID} not found in the cart`);
                return; // Skip this product
            }

            const quantityInStock = product.QUANTITY_IN_STOCK;
            if (quantityInStock < cartItem.quantity) {
                console.error(`Insufficient quantity in stock for product with ID ${product.ID}`);
                insufficientProducts.push({
                    product_item_id: product.ID,
                    quantity_in_stock: quantityInStock,
                    status: 'Insufficient'
                });
            }
        });

        if (insufficientProducts.length > 0) {
            this.ProduceMessage(
                PRODUCT_RESPONSE, 
                { 
                    status: 'InOrderable',
                    insufficient_products: insufficientProducts
                },
                orderKey
            )
        }
        else{
            this.ProduceMessage(
                PRODUCT_RESPONSE, 
                { 
                    type: 'OK',
                    status: 'Orderable'
                },
                orderKey
            )
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
                topics: [ORDER_CREATED, PRODUCT_VERIFY],
                fromBeginning: true
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
}

module.exports = ProductService;