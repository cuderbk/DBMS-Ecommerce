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
    product_id int,
    product_description text,
    product_name text,
    product_price decimal,
    quantity int,
    cart_subtotal decimal static,
    PRIMARY KEY (user_id, product_timestamp, product_id)
) WITH CLUSTERING ORDER BY (product_timestamp DESC, product_id ASC)
  AND default_time_to_live = 5184000;


INSERT INTO user_carts (user_id,cart_id,cart_is_active)
VALUES (1, 19925cc1-4f8b-4a44-b893-2a49a8434fc8,true);
INSERT INTO user_carts (user_id,cart_id,cart_is_active)
VALUES (2, 5453bd52-8366-4776-aa7c-d8d827176493,true);

create table test_decimal(
    decimalvalue decimal,
    primary key(decimalvalue)
);

-- Populate table cart_products:
------------------------------------------
INSERT INTO cart_products (user_id,product_timestamp,product_id,product_name,product_description,product_price,quantity,cart_subtotal)
VALUES (1,'2020-10-21 11:45:03',2,'Smartphone','Red roses and white Calla lilies',1000.00,1,1000.00);
INSERT INTO cart_products (user_id,product_timestamp,product_id,product_name,product_description,product_price,quantity,cart_subtotal)
VALUES (1,'2020-10-21 11:48:43',3,'T-Shirt','Comfortable cotton T-shirt',20.00,2,40.00);

INSERT INTO cart_products (user_id,product_timestamp,product_id,product_name,product_description,product_price,quantity,cart_subtotal)
VALUES (2,'2020-10-21 13:00:16',3,'T-Shirt','Comfortable cotton T-shirt',20.00,1,20.00);
INSERT INTO cart_products (user_id,product_timestamp,product_id,product_name,product_description,product_price,quantity,cart_subtotal)
VALUES (2,'2020-10-21 13:15:51',1,'Laptop','High-performance laptop',1500.00,1,1500.00);

-- INSERT INTO cart_products (user_id,product_timestamp,product_id,product_name,product_description,product_price,quantity,cart_subtotal)
-- VALUES (4e66baf8-f3ad-4c3b-9151-52be4574f2de,TOTIMESTAMP(NOW()),2,'Smartphone','Latest smartphone model',1000.00,1,1000.00);

-- INSERT INTO cart_products (user_id,product_timestamp,product_id,product_name,product_description,product_price,quantity,cart_subtotal)
-- VALUES (2ff01a3f-0b28-4894-bb3e-989f03412b06,TOTIMESTAMP(NOW()),2,'Smartphone','24 buttercream frosted cookies',1000.00,3,3000.00);
-- INSERT INTO cart_products (user_id,product_timestamp,product_id,product_name,product_description,product_price,quantity,cart_subtotal)
-- VALUES (2ff01a3f-0b28-4894-bb3e-989f03412b06,TOTIMESTAMP(NOW()),3,'T-Shirt','Comfortable cotton T-shirt',20.00,1,20.00);

-- INSERT INTO cart_products (user_id,product_timestamp,product_id,product_name,product_description,product_price,quantity,cart_subtotal)
-- VALUES (3ff4c697-ae75-449e-ab20-aac392f0bbf0,TOTIMESTAMP(NOW()),1,'Laptop','High-performance laptop',1500.00,2,3000.00);

CREATE TABLE IF NOT EXISTS user_review(
    user_id INT,
    order_id INT,
    rating_value INT,
    comment TEXT,
    created_at TIMESTAMP,
    year_post INT,
    PRIMARY KEY ((year_post), order_id, user_id)
);
INSERT INTO user_review (user_id, order_id, rating_value, comment, created_at, year_post) 
VALUES (1, 1, 4, 'Great service!', '2024-04-07 10:00:00', 2024); 
INSERT INTO user_review (user_id, order_id, rating_value, comment, created_at, year_post) 
VALUES(2, 2, 5, 'Amazing experience!', '2024-04-06 15:30:00', 2024);
INSERT INTO user_review (user_id, order_id, rating_value, comment, created_at, year_post) 
VALUES(1, 3, 3, 'Could be better.', '2024-04-05 12:45:00', 2024);
INSERT INTO user_review (user_id, order_id, rating_value, comment, created_at, year_post) 
VALUES(2, 4, 5, 'Excellent product quality.', '2024-04-04 09:20:00', 2024);
INSERT INTO user_review (user_id, order_id, rating_value, comment, created_at, year_post) 
VALUES(1, 5, 4, 'Satisfactory service.', '2024-04-03 14:10:00', 2024);

--create table search history
