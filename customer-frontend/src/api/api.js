import axios from 'axios';

export async function fetchProducts() {
    try {
        const response = await axios.get('http://localhost:8040/');
        return response.data.map(product => ({
            id: product.product_item_id,
            title: product.name,
            description: product.description,
            price: product.price,
            image: product.img
        }));
    } catch (error) {
        console.error('Error fetching data', error);
        return null;
    }
}

export async function fetchProductById(id) {
    try {
        const response = await axios.get(`http://localhost:8040/${id}`);
        return {
            id: response.data.id,
            title: response.data.name,
            description: response.data.description,
            price: response.data.price,
            image: response.data.img
        };
    } catch (error) {
        console.error('Error fetching data', error);
        return null;
    }
}