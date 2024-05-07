
const hgetall = async (key) => {
    return new Promise((resolve, reject) => {
        client.hGetAll(key, (err, result) => {
            if(err){
                return reject(err)
            }
            resolve(result)
        })
    })
}

const hget = async (key, field) => {
    return new Promise((resolve, reject) => {
        client.hget(key, field, (err, result) => {
            if(err){
                return reject(err)
            }
            resolve(result)
        })
    })
}
const hset = async (key, field, value) => {
    return new Promise((resolve, reject) => {
        client.hSet(key, field, value, (err, result) => {
            if(err){
                return reject(err)
            }
            resolve(result)
        })
    })
}


const exists = async (key) => {
    return new Promise((resolve, reject) => {
        client.exists(key, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
};

const setnx = async (key, value) => {
    return new Promise((resolve, reject) => {
        client.setnx(key, value, (err, result) => {
            if(err){
                return reject(err)
            }
            resolve(result)
        })
    })
}


module.exports = {
    hget,
    hset,
    exists,
    setnx,
}