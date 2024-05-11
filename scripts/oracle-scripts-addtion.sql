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

