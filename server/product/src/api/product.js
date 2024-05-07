const { PRODUCT_SERVICE } = require("../config");
const ProductService = require("../services/productService");
const {
  PublishCustomerEvent,
  PublishShoppingEvent,
  PublishMessage,
} = require("../utils");
// const UserAuth = require("./middlewares/auth");

exports.product = (app) => {
  const service = new ProductService();
  service.SubscribeEvents();
  app.post("/product/create", async (req, res, next) => {
    try {
        const { name, description, category_id, product_image, price, SKU, quantity_in_stock } = req.body;

        // Validate required fields
        const requiredFields = { name};
        for (const field in requiredFields) {
            if (!requiredFields[field]) {
                return res.status(400).json({ error: 'All fields are required' });
            }
        }
        // Call CreateProduct method of ProductService
        const data = await service.CreateProduct(req.body);
        // Send the response with the created product data
        return res.json({ success: true, data });
        } catch (error) {
            console.error('Error creating product:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    });
  
//   app.get("/category/:type", async (req, res, next) => {
//     const type = req.params.type;

//     try {
//       const { data } = await service.GetProductsByCategory(type);
//       return res.status(200).json(data);
//     } catch (error) {
//       return res.status(404).json({ error });
//     }
//   });
  app.get('/productverify', async (req,res) => {
    //check validation
    try {
      const products =[
        { product_item_id: 1, quantity: 4 },
        { product_item_id: 3, quantity: 10 }
      ]
      const { data } = await service.verifyProductAvailability(products , '1');
      return res.status(200).json(data);
    } catch (error) {
      console.log(error)
      return res.status(404).json({ error });
    }
  });
  app.get('/product:sales', async (req,res) => {
    //check validation
    try {
      const { data } = await service.GetProductsOnSale();
      return res.status(200).json(data);
    } catch (error) {
      return res.status(404).json({ error });
    }
  });
  app.put("/cart",  async (req, res, next) => {
    const user_id = Number(req.body.user_id);
    const productId = Number(req.body.product_item_id);
    const quantity = Number(req.body.quantity);
    // const product_name = req.body.product_name;
    // const product_description = req.body.product_description;
    // const product_price = Number(req.body.product_price);
    const { data } = await service.addProductToCart(user_id, productId, quantity)
    return res.status(200).json(data);
  });

//   app.delete("/cart/:id", UserAuth, async (req, res, next) => {
//     const { _id } = req.user;
//     const productId = req.params.id;

//     const { data } = await service.GetProductPayload(
//       _id,
//       { productId },
//       "REMOVE_FROM_CART"
//     );

//     // PublishCustomerEvent(data);
//     // PublishShoppingEvent(data);

//     PublishMessage(channel, CUSTOMER_SERVICE, JSON.stringify(data));
//     PublishMessage(channel, SHOPPING_SERVICE, JSON.stringify(data));

//     const response = { product: data.data.product, unit: data.data.qty };

//     res.status(200).json(response);
//   });

//   //get Top products and category
  app.get("/", async (req, res, next) => {
    //check validation
    try {
      const data  = await service.GetProducts();
      return res.status(200).json(data);
    } catch (error) {
      return res.status(404).json({ error });
    }
  });
  app.get("/:id", async (req, res, next) => {
    const productId = req.params.id;
    try {
      const  data  = await service.GetProductDetail(productId);
      return res.status(200).json(data);
    } catch (error) {
      return res.status(404).json({ error });
    }
  });
};