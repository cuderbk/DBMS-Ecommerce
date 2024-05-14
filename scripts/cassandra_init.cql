CREATE KEYSPACE if not exists ecommerce with replication = {
    'class': 'NetworkTopologyStrategy',
    'replication_factor':'1'
};

use ecommerce;

/* Session 2 - Shopping Cart data model */
CREATE TABLE IF NOT EXISTS user_carts (
    user_id int,
    cart_id uuid,
    cart_is_active boolean ,
    PRIMARY KEY (user_id)
) WITH default_time_to_live = 5184000;

CREATE TABLE IF NOT EXISTS cart_products (
    user_id int,
    product_timestamp timestamp,
    product_item_id int,
    product_description text,
    product_name text,
    product_price decimal,
    quantity int,
    cart_subtotal decimal static,
    PRIMARY KEY (user_id, product_item_id)
) WITH CLUSTERING ORDER BY ( product_item_id ASC)
  AND default_time_to_live = 5184000;


INSERT INTO user_carts (user_id,cart_id,cart_is_active)
VALUES (1, 19925cc1-4f8b-4a44-b893-2a49a8434fc8,true);
INSERT INTO user_carts (user_id,cart_id,cart_is_active)
VALUES (2, 5453bd52-8366-4776-aa7c-d8d827176493,true);


-- Populate table cart_products:
------------------------------------------
INSERT INTO cart_products (user_id,product_timestamp,product_item_id,product_name,product_description,product_price,quantity,cart_subtotal)
VALUES (1,'2020-10-21 11:45:03',2,'Smartphone','Red roses and white Calla lilies',1000.00,1,1000.00);
INSERT INTO cart_products (user_id,product_timestamp,product_item_id,product_name,product_description,product_price,quantity,cart_subtotal)
VALUES (1,'2020-10-21 11:48:43',3,'T-Shirt','Comfortable cotton T-shirt',20.00,2,40.00);

INSERT INTO cart_products (user_id,product_timestamp,product_item_id,product_name,product_description,product_price,quantity,cart_subtotal)
VALUES (2,'2020-10-21 13:00:16',3,'T-Shirt','Comfortable cotton T-shirt',20.00,1,20.00);
INSERT INTO cart_products (user_id,product_timestamp,product_item_id,product_name,product_description,product_price,quantity,cart_subtotal)
VALUES (2,'2020-10-21 13:15:51',1,'Laptop','High-performance laptop',1500.00,1,1500.00);

drop table if exists order_history;
CREATE TABLE IF NOT EXISTS order_history(
    user_id INT,
    order_id INT,
    order_status text,
    product_list list<frozen<map<text,INT>>>,
    payment_method VARCHAR,
    -- shipment_method VARCHAR,
    -- address_id INT,
    -- location 
    created_at TIMESTAMP,
    year_created INT,
    PRIMARY KEY ((year_created), order_id, user_id)
);
insert into order_history(user_id, order_id, order_status, product_list, payment_method, created_at, year_created)
values (1, 1, 'Completed', [{'product_item_id': 1, 'quantity': 4},{'product_item_id': 3, 'quantity': 10}], 'Wallet', '2024-05-04 10:00:00', 2024);
drop table if exists user_review;
CREATE TABLE IF NOT EXISTS user_review(
    user_id INT,
    order_id INT,
    rating_value INT,
    comment TEXT,
    created_at TIMESTAMP,
    PRIMARY KEY ((order_id), user_id)
);
INSERT INTO user_review (user_id, order_id, rating_value, comment, created_at) 
VALUES (1, 1, 4, 'Great service!', '2024-04-07 10:00:00'); 
INSERT INTO user_review (user_id, order_id, rating_value, comment, created_at) 
VALUES(2, 2, 5, 'Amazing experience!', '2024-04-06 15:30:00');
INSERT INTO user_review (user_id, order_id, rating_value, comment, created_at) 
VALUES(1, 3, 3, 'Could be better.', '2024-04-05 12:45:00');
INSERT INTO user_review (user_id, order_id, rating_value, comment, created_at) 
VALUES(2, 4, 5, 'Excellent product quality.', '2024-04-04 09:20:00');
INSERT INTO user_review (user_id, order_id, rating_value, comment, created_at) 
VALUES(1, 5, 4, 'Satisfactory service.', '2024-04-03 14:10:00');

--create table search history
