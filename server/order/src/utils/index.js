const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const createError = require('http-errors');
const {
  ACCESS_TOKEN_SECRET
} = require('../config');

//Utility functions
module.exports.verifyAccessToken = (req, res, next) => {
  if (!req.headers.authorization) {
    return next(createError.Unauthorized());
  }
  const signature = req.headers.authorization;
  const token = signature.split(" ")[1];
  console.log("check");
  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, payload) => { // Fixed the parenthesis
    if (err) {
      if(err.name ==='JsonWebTokenError'){
        return next(createError.Unauthorized());
      }
      return next(createError.Unauthorized(err));
    }
    req.payload = payload;
    next();
  });
};
module.exports.FormateData = (data) => {
  if (data) {
    return { data };
  } else {
    throw new Error("Data Not found!");
  }
};
