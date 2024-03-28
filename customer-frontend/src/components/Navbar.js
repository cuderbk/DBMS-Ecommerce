import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import CartIcon from './CartIcon';
import { CartContext } from './CartContext';

export default function Navbar() {
  const {cartProducts} = useContext(CartContext);
  return (
    <div className="">
      <nav className='w-full flex justify-center bg-[#333] py-5 px-16'>
        <a href="/" className="mx-2 text-white text-3xl font-bold no-underline">Ecommerce</a>
          <div className="flex-grow flex justify-center">
            <a href="/" className="text-white no-underline font-medium text-lg hover:border-b-2 hover:border-white mx-5">Home</a>
            <Link to="/all-products" className="text-white no-underline font-medium text-lg hover:border-b-2 hover:border-white mx-5">All Products</Link>
            <Link to="/all-products" className="text-white no-underline font-medium text-lg hover:border-b-2 hover:border-white mx-5">Categories</Link>
        </div>
        <CartIcon cartItemCount={cartProducts.length} />
      </nav>
    </div>
  )
}

