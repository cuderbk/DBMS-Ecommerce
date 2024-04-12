
const { FormatData } = require("../utils");
const {getCassClient, getClientOracle} = require('../database/index');
const cassandra = require('cassandra-driver');
const oracledb = require("oracledb")
// All Business logic will be here
class ProductService {

    constructor() {
        this.initilizeDB();
        // this.consumer = kafka.consumer({ groupId: CONSUMER_GROUP });
        // this.producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });
        console.log('Product Service initialized');
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

    async CreateProduct(productInputs) {
        try {
            const { name, description, category_id, product_image, price, SKU, quantity_in_stock } = productInputs;
    
            // Insert a new product into the product table
            const productResult = await this.oracleClient.execute(
                `INSERT INTO product (category_id, name, description, product_image)
                 VALUES (:category_id, :name, :description, :product_image)
                 RETURNING id INTO :outId`,
                {
                    category_id: category_id,
                    name: name,
                    description: description,
                    product_image: product_image,
                    outId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
                },
                { autoCommit: false } // Disable autoCommit to manage the transaction manually
            );
    
            // Get the generated product ID
            const productId = productResult.outBinds.outId[0];
    
            // Insert a new product item into the product_item table
            await this.oracleClient.execute(
                `INSERT INTO product_item (product_id, SKU, quantity_in_stock, product_image, price)
                 VALUES (:product_id, :SKU, :quantity_in_stock, :product_image, :price)`,
                {
                    product_id: productId,
                    SKU: SKU,
                    quantity_in_stock: quantity_in_stock,
                    product_image: product_image,
                    price: price
                },
                { autoCommit: false } // Disable autoCommit to manage the transaction manually
            );
    
            // Commit the transaction
            await this.oracleClient.commit();
    
            // Return the formatted product data
            return FormatData({ id: productId, ...productInputs });
        } catch (error) {
            console.error('Error creating product:', error);
            // Rollback the transaction in case of an error
            await this.oracleClient.rollback();
            throw error;
        }
    }
    
    async GetProducts() {

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
            `;
            const products = await this.oracleClient.execute(query,[],{ outFormat: oracledb.OUT_FORMAT_OBJECT });
            // Return the formatted product data
            const formattedProducts = products.rows.map(product => {
                return{
                    id: product.ID,
                    name: product.NAME,
                    description: product.DESCRIPTION,
                    category_id: product.CATEGORY_ID,
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
            const variations = await this.oracleClient.execute(query, [product_id],{ outFormat: oracledb.OUT_FORMAT_OBJECT });
    
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
            const variations = await this.oracleClient.execute(query, [product_id],{ outFormat: oracledb.OUT_FORMAT_OBJECT });
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
            let product = await this.oracleClient.execute(query,[product_id],{ outFormat: oracledb.OUT_FORMAT_OBJECT });
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
        const products = await this.oracleClient.execute(/* SELECT from products table WHERE category = ? */);
        return this.FormatData(products);
    }
    async calculateNewCartSubtotal(currentSubtotal, productPrice, quantity) {
        const totalPrice = productPrice * quantity;
        const newSubtotal = currentSubtotal + totalPrice;
        return newSubtotal;
    }

    async addProductToCart(user_id, product_item_id, quantity, product_name, product_price, product_description) {
        try {
            // Verify if the requested quantity is available
            const stockQuery = 'SELECT quantity_in_stock FROM product_item WHERE id = :pid';
            const stockParams = [product_item_id];
            const stockResult = await this.oracleClient.execute(stockQuery, stockParams);
    
            const availableStock = stockResult.rows[0].quantity_in_stock;
            if (quantity > availableStock) {
                // Rollback the transaction if the requested quantity exceeds the available stock
                // await this.CassClient.execute('ROLLBACK');
                throw new Error('Requested quantity exceeds available stock');
            } 
            //Use REDIS HERRRRRREEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
            // Check if the product already exists in the user's cart
            const cartQuery = 'SELECT * FROM ecommerce.cart_products WHERE user_id = :user_id AND product_item_id = :product_item_id';
            const cartParams = { user_id: user_id, product_item_id: product_item_id };
            const cartResult = await this.CassClient.execute(cartQuery, cartParams, { prepare: true });
     
            if (cartResult.rows.length > 0) {
                // If the product exists, update its quantity in the cart
                const updateQuantityQuery = `
                    UPDATE ecommerce.cart_products 
                    SET quantity = ?, 
                        product_timestamp = ?, 
                        cart_subtotal = ? 
                    WHERE user_id = ? AND product_item_id = ?`;
              
                // Calculate the new quantity by adding the existing quantity with the new quantity
                const newQuantity = Number(cartResult.rows[0].quantity) + quantity; 
            
                // Calculate the new product_timestamp (current timestamp) and cart_subtotal
                const productTimestamp =Date.now(); // or use your preferred method to get the current timestamp
                const cartSubtotal = await this.calculateNewCartSubtotal(Number(cartResult.rows[0].cart_subtotal), Number(cartResult.rows[0].product_price), quantity);
                const updateQuantityParams = [newQuantity, productTimestamp, cartSubtotal, user_id, product_item_id];
            
                await this.CassClient.execute(updateQuantityQuery, updateQuantityParams, { prepare: true });
            } else {
                // If the product does not exist, insert a new record into the cart
                const insertQuery = `
                    INSERT INTO ecommerce.cart_products 
                    (user_id, product_item_id, quantity, product_timestamp, cart_subtotal, product_name, product_description, product_price) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            
                // Calculate the new product_timestamp (current timestamp) and cart_subtotal
                const productTimestamp = new Date(); // or use your preferred method to get the current timestamp
                const cartSubtotal =await this.calculateNewCartSubtotal(1,2,3); // Implement your logic to calculate the cart subtotal
            
                const insertParams = [user_id, product_item_id, quantity, productTimestamp, cartSubtotal, product_name, product_description, product_price];
            
                await this.CassClient.execute(insertQuery, insertParams, { prepare: true });
            }
            
            // cassandra driver use await as commit that ensure update must completed
    
            return { success: true };
        } catch (error) {
            console.error('Error adding product to cart:', error);
            throw error;
        }
    }
    


    // async GetProductPayload(userId,{ productId, qty },event){

    //      const product = await this.repository.FindById(productId);

    //     if(product){
    //          const payload = { 
    //             event: event,
    //             data: { userId, product, qty}
    //         };
 
    //          return FormateData(payload)
    //     }else{
    //         return FormateData({error: 'No product Available'});
    //     }

    // }
 

}

module.exports = ProductService;