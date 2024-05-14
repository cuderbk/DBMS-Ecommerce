const cassandra = require('cassandra-driver');

const authProvider = new cassandra.auth.PlainTextAuthProvider(
    process.env.CASSANDRA_USER,
    process.env.CASSANDRA_PASS,
    );
exports.getCassClient =  () => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = new cassandra.Client({
        contactPoints: ['localhost'],
        localDataCenter: 'datacenter1',
        keyspace: 'ecommerce' // Typo fixed here
      }); 
      await client.connect();
      console.log('Connected to Cassandra');
      resolve(client)
    } catch (error) {
      console.error('Error connecting to Cassandra:', err);
      reject(error)
    }
  });
};
const oracledb = require("oracledb")

exports.getClientOracle = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await oracledb.getConnection({
        user: "eadm",
        password: "pwd",
        connectString: `localhost:${process.env.ORACLE_EXPORT_PORT}/ecommercedb2` // Replace with your Oracle Database connection string
      })
      console.log("Connected to Oracle Database")
      resolve(connection)
    } catch (err) {
      console.error("Error connecting to Oracle Database:", err)
      reject(err)
    }
  });
}

