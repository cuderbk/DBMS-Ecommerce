const {getCassClient, getClientOracle} = require('../database/index');
const cassandra = require('cassandra-driver');
const oracledb = require("oracledb")
const { v4: uuidv4 } = require("uuid");
const {FormateData} = require('../utils');
const moment = require('moment');

const { order } = require('../api/order');

class OrderService{
    constructor() {
        this.initilizeDB();
    } 
    async initilizeDB(){
        // this.CassClient =await getCassClient();
        // try {
        //     await this.CassClient.connect();
        //     console.log('Connected to Cassandra');
        // } catch (err) {
        //     console.error('Error connecting to Cassandra:', err);
        //     throw err; // Re-throw the error to handle it elsewhere
        // }
        this.OracleClient =await getClientOracle();
    }
    async GetOrdersByUser( _id ){
        try {
            
            const query = `SELECT so.order_date, so.payment_method, so.shipping_address, sm.name, so.order_total, so.paid, os.status
            FROM shop_order so
            JOIN shipping_method sm ON sm.id = so.shipping_method_id
            join order_status os on os.id = so.order_status
            WHERE so.user_id = :user_id
            ORDER BY so.order_date DESC`
            const orders = await this.OracleClient.execute(
                query,
                [1],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            )
            return FormateData(orders.rows)
        } catch (error) {
            throw error(error)
        }
    }
    async GetOrderDetail(userId, orderId){
        try {
            // Authorization

            // const query = `select count(*) 
            // from shop_order 
            // where id = :orderId and user_id = :userId;`
            // const order = await this.OracleClient.execute(
            //     query,
            //     [orderId, userId],
            //     { outFormat: oracledb.OUT_FORMAT_OBJECT }
            // )
            const query = `select 
        prv.id, prv.product_id, prv.name, 
        prv.price as original_price, ol.price as price_selled, ol.quantity, 
        prv.image_main, 
        prv.category_name, prv.product_category_id
        from order_line ol
        join PRODUCTS_RETRIEVE_VIEW prv on prv.id = ol.product_item_id 
        where ol.order_id = :orderId`
            const order = await this.OracleClient.execute(
                query,
                [orderId],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            )
            return FormateData(order.rows)
        } catch (error) {
            throw error(error)
        }
    }
    async GetOrderStatisticByDay(){
        try {
            const query = `select * from OrderSummaryByDate`
            const result = await this.OracleClient.execute(
                query,
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            )
            const formattedData = [];

            // Iterate over each record in result.rows
            result.rows.forEach((record) => {
                formattedData.push({
                    week: moment(record.ORDER_DATE).isoWeek(),
                    order_date: moment(record.ORDER_DATE).toDate(), // Convert to JavaScript Date object
                    order_count: record.ORDER_COUNT,
                    ravenue: record.REVENUE
                });
            });
            return FormateData(formattedData)   
        } catch (error) {
            console.log(error)
            throw error(error)
        }
    }
    async GetTopProductOrdered(){
        try {
            const query = `
            select ol.product_item_id , 
            sum(ol.quantity) as total_quantity, 
            count(order_id) as product_exist_in_order
            from shop_order  so
            join  order_line ol on ol.order_id = so.id
            group by ol.product_item_id
            order by total_quantity desc`
            const result = await this.OracleClient.execute(
                query,
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            )
            return FormateData(result.rows) 
        } catch (error) {
            console.log(error)
            throw error(error)
        }
    }
}
module.exports = OrderService;