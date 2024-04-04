CREATE KEYSPACE IF NOT EXISTS store WITH REPLICATION = {
    'class': 'NetworkTopologyStrategy',
    'sel1':3
};
-- CREATE TABLE IF NOT EXISTS store.shopping_cart(
--     userid text PRIMARY KEY,
--     item_count int,
--     last_updated TIMESTAMP
-- );

-- INSERT INTO store.shopping_cart
-- (userid, item_count, last_updated)
-- VALUES ('9876', 2, toTimeStamp(now()));
-- INSERT INTO store.shopping_cart
-- (userid, item_count, last_updated)
-- VALUES ('1234', 5, toTimeStamp(now()));

CREATE KEYSPACE if not exists learn_cassandra with replication = {
    'class': 'NetworkTopologyStrategy',
    'replication_factor':'3'
};