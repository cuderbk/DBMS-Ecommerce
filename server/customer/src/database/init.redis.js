const redis = require('redis');

let client = {}, statusConnectionRedis = {
    CONNECT: 'connect',
    END: 'end',
    RECONNECT: 'reconnecting',
    ERROR: 'error'
}

const handleEventConnection = ({
    connectionRedis
}) => {
    connectionRedis.on(statusConnectionRedis.CONNECT,() => {
        console.log(`ConnectionRedis - Connection status: connected`);
    })
    
    connectionRedis.on(statusConnectionRedis.END,() => {
        console.log(`ConnectionRedis - Connection status: disconnected`);
    }) 

    connectionRedis.on(statusConnectionRedis.RECONNECT,() => {
        console.log(`ConnectionRedis - Connection status: reconnecting`);
    }) 

    connectionRedis.on(statusConnectionRedis.ERROR,(error) => {
        console.log(`ConnectionRedis - Connection status: error ${error}`);
    }) 
}

const initRedis = () => {
    const instanceRedis = redis.createClient().connect();
    client.instanceConnect = instanceRedis;
    handleEventConnection({
        connectionRedis: instanceRedis
    });
}
const getRedis = () => client

const closeRedis = () => {

}

module.exports= {
    initRedis,
    getRedis,
    closeRedis
};