const cassandra = require('cassandra-driver');

const authProvider = new cassandra.auth.PlainTextAuthProvider(
    process.env.CASSANDRA_USER,
    process.env.CASSANDRA_PASS,
    );
exports.getCassClient = async () => {
    const client = new cassandra.Client({
        contactPoints: ['localhost'],
        localDataCenter: 'datacenter1',
        keyspace: 'ecommerce' // Typo fixed here
    });
    
    try {
        await client.connect();
        console.log('Connected to Cassandra');
        return client;
    } catch (err) {
        console.error('Error connecting to Cassandra:', err);
        throw err; // Re-throw the error to handle it elsewhere
    }
};