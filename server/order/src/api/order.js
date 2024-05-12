const { ORDER_SERVICE } = require("../config");
const OrderCommunication = require("../services/orderCommunication");
const OrderService = require("../services/OrderService");
const { verifyAccessToken } = require("../utils");

exports.order = async (app) => {
  const service = await new OrderCommunication();
  service.SubscribeEvents();

  const Order = await new OrderService();

  app.get('/', async (req,res) => {
    //check validation
    try {
      const { data } = {message: "hehe"}
      return res.status(200).json(data);
    } catch (error) {
      return res.status(404).json({ error });
    }
  });
  // app.post('/test-create-order',verifyAccessToken, async (req,res) => {
  //   //check validation
  //   try {
  //     const reqBody = req.body;
  //     // console.log(reqBody)
  //     const { data } = service.createOrder(reqBody)
  //     // const {data} = {message:"hehe"}
  //     return res.status(200).json(data);
  //   } catch (error) {
  //     return res.status(404).json({ error });
  //   }
  // });
  app.get('/user-orders',verifyAccessToken , async(req, res, next) => {
    try {
      const  userId  = req.payload.userId;
      console.log(userId)
      const {data} = await Order.GetOrdersByUser( userId );
      return res.status(200).json(data);
    } catch (error) {
      return res.status(404).json({error})
    }
  })
  app.get('/order/:id', verifyAccessToken, async(req, res, next) => {
    try {
      const  userId  = req.payload.userId;
      const orderId = req.params.id;
      const { data } = await Order.GetOrderDetail(userId, orderId);
      return res.status(200).json(data);
    } catch (error) {
      return res.status(404).json({error})
    }
  })
  // order/:id
  // order/:user
  // order aggregation by month, year, day
  app.get('/order-statistic-day', verifyAccessToken, async(req, res, next) => {
    try {
      // const orderId = req.params.id;
      const { data } = await Order.GetOrderStatisticByDay();
      return res.status(200).json(data);
    } catch (error) {
      return res.status(404).json({error})
    }
  })
  app.get('/top-product-ordered', verifyAccessToken, async(req, res, next) => {
    try {
      // const orderId = req.params.id;
      const { data } = await Order.GetTopProductOrdered();
      return res.status(200).json(data);
    } catch (error) {
      return res.status(404).json({error})
    }
  })
};