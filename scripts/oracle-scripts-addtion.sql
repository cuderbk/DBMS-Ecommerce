CREATE OR REPLACE TYPE order_line_type force AS  OBJECT (
    product_item_id ORDER_LINE.PRODUCT_ITEM_ID%TYPE,
    quantity ORDER_LINE.QUANTITY%TYPE,
    price ORDER_LINE.PRICE%TYPE
);
/

CREATE OR REPLACE TYPE order_line_list AS TABLE OF order_line_type;
/
CREATE OR REPLACE PROCEDURE Create_Order (
    p_user_id             IN shop_order.user_id%TYPE,
    p_payment_method      IN shop_order.PAYMENT_METHOD%TYPE,
    p_shipping_address    IN shop_order.SHIPPING_ADDRESS%TYPE,
    p_shipping_method_id  IN shop_order.SHIPPING_METHOD_ID%TYPE,
    p_order_total         IN shop_order.ORDER_TOTAL%TYPE,
    p_order_status        IN shop_order.ORDER_STATUS%TYPE,
    p_order_lines         IN ORDER_LINE_LIST,
    p_paid                IN shop_order.PAID%TYPE,
    v_order_id            OUT NUMBER) -- Adding v_order_id as an OUT parameter
IS
BEGIN
    -- Insert a new order into the shop_order table
    INSERT INTO shop_order (user_id, order_date, payment_method, shipping_address, shipping_method_id, order_total, order_status, paid)
    VALUES (p_user_id, SYSDATE, p_payment_method, p_shipping_address, p_shipping_method_id, p_order_total, p_order_status, p_paid)
    RETURNING id INTO v_order_id;

    -- Insert order lines into the order_line table
    FOR i IN 1..p_order_lines.COUNT LOOP
        INSERT INTO order_line (product_item_id, order_id, quantity, price)
        VALUES (p_order_lines(i).product_item_id, v_order_id, p_order_lines(i).quantity, p_order_lines(i).price);
    END LOOP;

    COMMIT;

    DBMS_OUTPUT.PUT_LINE('Order created successfully with ID: ' || v_order_id);
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Error creating order: ' || SQLERRM);
        RAISE;
END Create_Order;
/
alter table order_line  add price decimal(16,3) ;
update order_line set price = 482.500;

create or replace view OrderSummaryByYear as
select  EXTRACT(YEAR FROM order_date) as YearOrder  ,
count(*) as order_count, sum(order_total) as revenue
from shop_order
group by EXTRACT(YEAR FROM order_date) ;


create or replace view OrderSummaryByMonth as
select 
EXTRACT(YEAR FROM order_date) as Year, 
EXTRACT(Month FROM order_date) as Month  ,
count(*) as order_count, sum(order_total) as revenue
from shop_order
group by 
EXTRACT(YEAR FROM order_date), 
EXTRACT(Month FROM order_date) ;


create or replace view OrderSummaryByDate as
select order_date ,
count(*) as order_count, sum(order_total) as revenue
from shop_order
group by order_date ;


---------------------CHECK REVIEW ORDER----------------------
alter table SHOP_ORDER add IS_REVIEWED NUMBER(1,0) DEFAULT 0;
--------------------------------------------