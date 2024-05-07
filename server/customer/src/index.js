const express = require('express');
// const session = require("express-session");
// const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const {customer} = require('./api/customer');
const {PORT} = require('./config/index');
const redisModule = require('./database/init.redis');
const {createClient} = require('redis');

const StartServer = async() => {
    const app = express();

    app.use(express.json());
    app.use(morgan("dev"));
    app.use(cors({ origin: true, credentials: true }));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser());

    app.listen(PORT, () => {
        console.log(`listening to port ${PORT}`);
    })
    .on('error', (err) => {
    console.log(err);
    process.exit();
    })

    // await redisModule.initRedis();



    await customer(app);
};
StartServer();