require('dotenv').config();
const express = require('express');
const cassandra = require('cassandra-driver');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const authProvider = new cassandra.auth.PlainTextAuthProvider(
    process.env.CASSANDRA_USER,
    process.env.CASSANDRA_PASS,
    );
const client = new cassandra.Client({
    contactPoints: ['localhost'],
    localDataCenter: 'se1',
    key_space: 'example'
});
client.connect(err => {
    if (err) {
        console.error('Error connecting to Cassandra:', err);
    } else {
        console.log('Connected to Cassandra');
    }
});
app.use(express.json());

// Add other CRUD operations (read, update, delete) here
const port = process.env.PORT || 5050;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});