import React from 'react';
import { FaClipboard } from "react-icons/fa";
import {Link} from 'react-router-dom'

function OrdersIcon({ cartItemCount }) {
  return (
    <Link to="/orders" className="relative hover:border-b-2 hover:border-white me-5">
      <FaClipboard  size={'2rem'} color={'white'} />
    </Link>
  );
}

export default OrdersIcon;