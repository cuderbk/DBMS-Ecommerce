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