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
    
    return client;
};
const oracledb = require("oracledb")
oracledb.createPool({
  user: "eadm",
  password: "pwd",
  connectString: `localhost:${process.env.ORACLE_EXPORT_PORT}/ecommercedb2`, // Replace with your Oracle Database connection string
  poolMin: 1,
  poolMax: 10,
  poolTimeout: 300,
  poolAlias: 'prodpool'
})
exports.getClientOracle = async() => {
  try {  
    const connection = await oracledb.getConnection('prodpool')
    console.log("Connected to Oracle Database")
    return connection
  } catch (err) {
    console.error("Error connecting to Oracle Database:", err)
  }
}

