CREATE PLUGGABLE DATABASE ecommercedb  
ADMIN USER eadm  
IDENTIFIED BY pwd  
FILE_NAME_CONVERT = ('pdbseed', 'pdbecommerce');

alter PLUGGABLE DATABASE ecommercedb open read write;

alter session set container = ecommercedb;

grant dba to eadm;

-- conn eadm/pwd@localhost:1521/ecommercedb;