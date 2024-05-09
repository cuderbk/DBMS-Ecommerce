import React from 'react';
import { IoMdCart } from 'react-icons/io';
import {Link} from 'react-router-dom'

function CartIcon({ cartItemCount }) {
  return (
    <Link to="/cart" className="relative hover:border-b-2 hover:border-white">
      <IoMdCart size={'2rem'} color={'white'} />
      {cartItemCount > 0 && (
        <span className="absolute top-[-3px] right-[-4px] bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">
          {cartItemCount}
        </span>
      )}
    </Link>
  );
}

export default CartIcon;