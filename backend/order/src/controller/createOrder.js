const kafka = require('../../../kafkaBroker/kafka');
const {Partitioners} = require('kafkajs');

const createOrder = async(req, res) => {
    try {
        const producer = await kafka.producer({createPartitioner: Partitioners.LegacyPartitioner });
        await producer.connect();
        
        const payload = {
            "data" : {
                // id : order._id,
                // transactionId : order.transactionId,
                // amount : amount
                "id" : 1,
                
            }
        }
        await producer.send({
            topic : 'ORCHESTATOR_SERVICE', // ORDER_CREATION_TRANSACTIONS
            messages: [
                {key: 'ORDER_CREATED', value: 'HELLO', partition: 0}
            ]
        })
        console.log("send completed");


    } catch (e) {
        console.log(e)
    }
}
createOrder();
