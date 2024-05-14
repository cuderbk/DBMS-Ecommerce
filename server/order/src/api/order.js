const { ORDER_SERVICE } = require("../config");
const OrderCommunication = require("../services/orderCommunication");
const OrderService = require("../services/OrderService");
const { verifyAccessToken } = require("../utils");
const socketIOClient = require('socket.io-client');

exports.order = async (app) => {
  const service = await new OrderCommunication();
  service.SubscribeEvents();

  const Order = await new OrderService();
  const io = await socketIOClient('http://localhost:8000', {
    cors: {
      origin: '*', // Allow any origin for testing purposes. Change this in production.
    },
  });
  // io.on('connect', () => {
  //   console.log('Connected to the gateway Socket.IO server');

  //   // Handle events from the gateway
  //   io.on('event_to_clients', (data) => {
  //     console.log('Received broadcast event in Order service:', data);
  //     // Handle the event as needed
  //   });
  // });

  io.on('disconnect', () => {
    console.log('Disconnected from the gateway Socket.IO server');
  });

  // Example of emitting an event from the Order service
  io.emit('event_from_order_service', { message: 'Hello from Order service' });

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
  app.get('/order-review/:id', verifyAccessToken, async(req, res, next) => {
    try {
      const  userId  = req.payload.userId;
      const orderId = req.params.id;
      const { data } = await Order.getOrderReview( orderId);
      return res.status(200).json(data);
    } catch (error) {
      return res.status(404).json({error})
    }
  })
  app.post('/order-review/:id', verifyAccessToken, async(req, res, next) => {
    try {
      const userId = req.payload.userId
      const orderId = req.params.id
      const {comment, rating_value} = req.body
      const {data} = await Order.addOrderReview(userId, orderId, comment, rating_value)
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