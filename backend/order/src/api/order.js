const { ORDER_SERVICE } = require("../config");
const OrderService = require("../services/orderService");
const {
  PublishCustomerEvent,
  PublishShoppingEvent,
  PublishMessage,
} = require("../utils");
// const UserAuth = require("./middlewares/auth");

exports.order = (app) => {
  const service = new OrderService();
  service.SubscribeEvents();

};