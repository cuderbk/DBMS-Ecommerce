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
        this.CassClient =await getCassClient();
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
    async getOrderReview(orderId){
        try {
            // default fetchSize of 5000 rows,
            const query = `select * from user_review where order_id =?`
            const params = [orderId]
            const reviews = await this.CassClient.execute(
                query,
                params,
                { prepare: true }
            )
            return FormateData(reviews.rows)
        } catch (error) {
            console.log(error)
            throw error(error)
        }
    }
    async addOrderReview(userId, orderId, comment, rating_value){
        try {
            const isReviewed = await this.checkOrderReviewed(orderId)
            if (!isReviewed) {
                const current = moment().utc().format('Y-M-D hh:MM:ss')
                const query = `INSERT INTO user_review 
                (user_id, order_id, rating_value, comment, created_at)
                VALUES (?, ?, ?, ?, ?)`
                const params = [
                    userId, 
                    orderId, 
                    rating_value, 
                    comment,
                    current]
                console.log(params)
                const review =await this.CassClient.execute(
                    query,
                    params,
                    { prepare: true }
                )
                await this.patchOrderReviewed(orderId);
                return FormateData({
                    orderId: orderId,
                    message: "Reviewed successfully"})
            }
            return FormateData({
                orderId: orderId,
                message: "Reviewed successfully"})
        } catch (error) {
            console.log(error)
            throw error(error)
        }
    }
    async patchOrderReviewed(orderId){
        try {
            const query = `
            UPDATE SHOP_ORDER
            SET is_reviewed = 1
            WHERE id = :orderId
            `;
            const params = {
                orderId: orderId
            }
            const result = await this.OracleClient.execute(
                query,
                params,
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            )
            await this.OracleClient.commit()
        } catch (error) {
            console.log(error);
            throw error(error);
        }
    }
    async checkOrderReviewed(orderId){
        try {
            const query = `SELECT IS_REVIEWED 
            FROM SHOP_ORDER
            WHERE id = :orderId`
            const params = {
                orderId: orderId
            }
            const result =await  this.OracleClient.execute(
                query,
                params,
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            )

            return result.rows[0].IS_REVIEWED
        } catch (error) {
            console.log(error)
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


// try {
//     const query = ``
//     const params = []
//     const result = this.OracleClient.execute(
//         query,
//         params,
//         { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     )
// } catch (error) {
    
// }