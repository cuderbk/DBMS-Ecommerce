const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const createError = require('http-errors');


const {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  EXCHANGE_NAME,
  CUSTOMER_SERVICE,
} = require("../config");

//Utility functions
module.exports.GenerateSalt = async () => {
  return await bcrypt.genSalt();
};

module.exports.GeneratePassword = async (password, salt) => {
  return await bcrypt.hash(password, salt);
};

module.exports.ValidatePassword = async (
  enteredPassword,
  savedPassword,
  salt
) => {
  return (await this.GeneratePassword(enteredPassword, salt)) === savedPassword;
};

module.exports.GenerateSignature = async (userId) => {
  try {
    const payload = {
      userId: userId
    }
    return await jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "7d" });
  } catch (error) {
    console.log(error);
    return error;
  }
};
module.exports.GenerateRefreshToken = async (userId) => {
  try {
    const payload = {
      userId: userId
    }
    return await jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: "30d" });
  } catch (error) {
    console.log(error);
    return error;
  }
};

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
      return next(createError.Unauthorized(err.message));
    }
    req.payload = payload;
    next();
  });
};
module.exports.verifyRefreshToken = async (refreshToken) => {
  return new Promise( (resolve, reject) => {
    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, payload) => {
      if(err){
        return reject(err);
      }
      resolve(payload)
    })
  })
}

module.exports.FormateData = (data) => {
  if (data) {
    return { data };
  } else {
    throw new Error("Data Not found!");
  }
};


