import React from 'react';
import ProductBox from './ProductBox';

export default function Products({ products }) {
    return (
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-6 md:grid-cols-4">
        {products?.length > 0 && products.map(product => (
          <ProductBox key={product.id} {...product} />
        ))}
      </div>
    );
}