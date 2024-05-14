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
const oracledb = require("oracledb");

let poolExists = false;

async function createOraclePool() {
  try {
    await oracledb.createPool({
      user: "eadm",
      password: "pwd",
      connectString: `localhost:${process.env.ORACLE_EXPORT_PORT}/ecommercedb2`, // Replace with your Oracle Database connection string
      poolMin: 1,
      poolMax: 10,
      poolTimeout: 300,
      poolAlias: 'cuspool'
    });
    poolExists = true;
    console.log("Oracle Pool created successfully.");
  } catch (err) {
    console.error("Error creating Oracle Pool:", err);
    throw err;
  }
}

exports.getClientOracle = () => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!poolExists) {
        await createOraclePool();
      }
      const connection = await oracledb.getConnection('cuspool');
      console.log("Connected to Oracle Database");
      resolve(connection);
    } catch (err) {
      console.error("Error connecting to Oracle Database:", err);
      reject(err);
    }
  });
};
