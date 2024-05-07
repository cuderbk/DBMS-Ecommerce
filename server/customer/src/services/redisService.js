const {getRedis}  = require('..//database/init.redis')

const{
    instanceConnect: redisClient
} = getRedis();