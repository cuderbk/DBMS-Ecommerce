import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { fetchOrders, fetchOrderDetails } from '../api/api';
import UserContext from '../components/UserContext';

function Orders() {
  const { user } = useContext(UserContext);
  const [orders, setOrders] = useState([]);
  const [orderDetails, setOrderDetails] = useState([]);
  const token = user.token;

  useEffect(() => {
    fetchOrders(token).then(data => {
      if (data) {
        setOrders(data);
      }
    });
  }, []);

  useEffect(() => {
    orders.forEach(order => {
      fetchOrderDetails(order.id, token).then(details => {
        console.log(order.id);
        console.log(details);
        setOrderDetails(prevDetails => ({ ...prevDetails, [order.id]: details }));
      });
    });
  }, [orders]);


  return (
    <div className="container mx-auto px-4 min-h-screen">
      <h1 className="text-4xl font-bold mb-4 mt-4">Orders</h1>
      <div className='grid grid-cols-1 gap-10 md:grid-cols-[1.5fr,.5fr]'>
        <table className="table-auto w-full bg-white rounded-lg p-8">
          <thead>
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Shipping method</th>
              <th className="px-4 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td className="border px-4 py-2 text-center">{order.id}</td>
                <td className="border px-4 py-2 text-center">
                  {new Date(order.orderDate).toLocaleDateString("en-US", {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  })}
                </td>
                <td className="border px-4 py-2 text-center">{order.status}</td>
                <td className="border px-4 py-2 text-center">{order.orderTotal}</td>
                <td className="border px-4 py-2 text-center">{order.shippingMethod}</td>
                <td className="border px-4 py-2 text-center">
                  {orderDetails[order.id] && orderDetails[order.id].map(detail => (
                    <div key={detail.id}>
                      {detail.name} x {detail.quantity}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Rest of your component */}
      </div>
    </div>
  );
}

export default Orders;