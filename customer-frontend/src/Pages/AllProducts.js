import React, { useEffect, useState } from 'react';
import { ProductsGrid } from '../components';
;

export default function AllProducts() {
	const [products, setProducts] = useState([]);

	useEffect(() => {
		fetch('https://fakestoreapi.com/products?sort=desc')
		.then(res => res.json())
		.then(data => setProducts(data))
		.catch(error => console.error('Error:', error));
	}, []);
	return (
		<div className="px-16">
			<h1 className='text-3xl font-bold my-5'> 
			All Products </h1>
			<ProductsGrid products={products} />
		</div>
	);
	}
