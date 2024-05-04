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

exports.getClientOracle = async() => {
  try {
    await oracledb.createPool({
      user: "eadm",
      password: "pwd",
      connectString: "localhost/ecommercedb", // Replace with your Oracle Database connection string
      poolMin: 1,
      poolMax: 10,
      poolTimeout: 300,
      poolAlias: 'prodpool'
    })
    const connection = oracledb.getConnection('prodpool')
    console.log("Connected to Oracle Database")
    return connection
  } catch (err) {
    console.error("Error connecting to Oracle Database:", err)
  }
}

