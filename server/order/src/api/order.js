const { ORDER_SERVICE } = require("../config");
const OrderService = require("../services/orderService");
const {
  PublishCustomerEvent,
  PublishShoppingEvent,
  PublishMessage,
} = require("../utils");
// const UserAuth = require("./middlewares/auth");

exports.order = async (app) => {
  const service = await new OrderService();
  service.SubscribeEvents();
  app.get('/', async (req,res) => {
    //check validation
    try {
      const { data } = {message: "hehe"}
      return res.status(200).json(data);
    } catch (error) {
      return res.status(404).json({ error });
    }
  });
  app.post('/test-create-order', async (req,res) => {
    //check validation
    try {
      const reqBody = req.body;
      // console.log(reqBody)
      const { data } = service.createOrder(reqBody)
      // const {data} = {message:"hehe"}
      return res.status(200).json(data);
    } catch (error) {
      return res.status(404).json({ error });
    }
  });
};