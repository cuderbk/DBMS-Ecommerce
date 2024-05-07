import React, { useEffect, useState } from 'react';
import { ProductsGrid } from '../components';
import { fetchProducts } from '../api/api.js';

export default function AllProducts() {
	const [products, setProducts] = useState([]);

	useEffect(() => {
		fetchProducts().then(data => {
			if (data) {
				setProducts(data);
			}
		});
	}, []);

	return (
		<div className="px-16">
			<h1 className='text-3xl font-bold my-5'> 
			All Products </h1>
			<ProductsGrid products={products} />
		</div>
	);
	}
