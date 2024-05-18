import { useContext } from 'react';
import axios from 'axios';
import UserContext from '../components/UserContext';

export async function fetchProducts() {
    try {
        const response = await axios.get('http://localhost:8040/');
        return response.data.map(product => ({
            id: product.product_item_id,
            title: product.name,
            description: product.description,
            price: product.price,
            image: product.product_image
        }));
    } catch (error) {
        console.error('Error fetching data', error);
        return null;
    }
}

export async function fetchProductById(id) {
    try {
        console.log(`http://localhost:8040/${id}`);
        const response = await axios.get(`http://localhost:8040/${id}`);
        console.log(response.data);
        return {
            id: response.data._id,
            title: response.data.productname,
            description: response.data.short_description,
            price: response.data.price,
            image: response.data.featuredimageUrl
        };
    } catch (error) {
        console.error('Error fetching data', error);
        return null;
    }
}

export async function fetchOrders(token) {
    try {
        console.log('fetchOrders')
        console.log(token)
        const response = await axios.get('http://localhost:8042/user-orders', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data.map(order => ({
            id: order.ID,
            orderDate: order.ORDER_DATE,
            paymentMethod: order.PAYMENT_METHOD,
            shippingAddress: order.SHIPPING_ADDRESS,
            shippingMethod: order.NAME,
            orderTotal: order.ORDER_TOTAL,
            paid: order.PAID,
            status: order.STATUS
        }));
    } catch (error) {
        console.error('Error fetching orders', error);
        return null;
    }
}

export async function fetchOrderDetails(orderId, token) {
    try {
        const response = await axios.get(`http://localhost:8042/order/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data.map(item => ({
            id: item.ID,
            productId: item.PRODUCT_ID,
            name: item.NAME,
            originalPrice: item.ORIGINAL_PRICE,
            priceSelled: item.PRICE_SELLED,
            quantity: item.QUANTITY,
            imageMain: item.IMAGE_MAIN,
            categoryName: item.CATEGORY_NAME,
            productCategoryId: item.PRODUCT_CATEGORY_ID
        }));
    } catch (error) {
        console.error('Error fetching order details', error);
        return null;
    }
}