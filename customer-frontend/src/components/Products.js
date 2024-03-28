import React from 'react'
import ProductsGrid from './ProductsGrid'


export default function Products({products}) {
  return (
	<div className="px-16">
    	<ProductsGrid products={products} />
	</div>
  );
  }
