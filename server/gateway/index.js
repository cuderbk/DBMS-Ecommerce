const express = require("express");
const cors = require("cors");
const proxy = require("express-http-proxy");
const dotenv = require('dotenv').config()
const app = express();

app.use(cors());
app.use(express.json());

app.use("/", proxy(`http://localhost:${process.env.PRODUCT_SERVICE_PORT}`)); // products
app.use("/customer", proxy("http://localhost:8081"));
app.use("/order", proxy("http://localhost:8082"));

app.listen(8000, () => {
  console.log("Gateway is Listening to Port 8000");
});