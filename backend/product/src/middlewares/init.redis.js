const redis = require('redis');
const client = redis.createClient({
    legacyMode: true
});

// Optionally handle errors
client.on('error', function (err) {
    console.error('Redis Error: ' + err);
});

module.exports = client;
