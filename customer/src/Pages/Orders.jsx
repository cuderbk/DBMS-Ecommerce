import React, { useState, useEffect } from 'react';

function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const mockData = [
      { id: 1, date: '2022-01-01', status: 'Shipped', total: 100, details: '2x Product 1 ' },
      { id: 2, date: '2022-01-02', status: 'Pending', total: 200, details: 'Product 2' },
      { id: 3, date: '2022-01-03', status: 'Processing', total: 300, details: 'Product 3' },
    ];
    setOrders(mockData);
  }, []);
  const orderSummary = {
    totalOrders: 10,
    cancelled: 2,
    pending: 3,
    shipped: 4,
    processing: 1,
    totalSpend: 1000,
  };

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
                    <th className="px-4 py-2">Details</th>
                </tr>
                </thead>
                <tbody>
                {orders.map(order => (
                    <tr key={order.id}>
                    <td className="border px-4 py-2">{order.id}</td>
                    <td className="border px-4 py-2">{order.date}</td>
                    <td className="border px-4 py-2">{order.status}</td>
                    <td className="border px-4 py-2">{order.total}</td>
                    <td className="border px-4 py-2">{order.details}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            <div className="bg-white rounded-lg border border-gray-300 p-4">
                <h2 className="font-bold text-lg mb-4">Summary</h2>
                <p className="text-gray-700 font-bold text-lg">Total Orders: {orderSummary.totalOrders}</p>
                <p className="text-red-500 font-bold text-lg">Cancelled: {orderSummary.cancelled}</p>
                <p className="text-blue-300 font-bold text-lg">Pending: {orderSummary.pending}</p>
                <p className="text-green-500 font-bold text-lg">Shipped: {orderSummary.shipped}</p>
                <p className="text-blue-600 font-bold text-lg">Processing: {orderSummary.processing}</p>
                <p className="text-green-600 font-bold text-2xl">Total Spend: {orderSummary.totalSpend.toLocaleString('en-US')}</p>
                </div>

      </div>
      
    </div>
  );
}

export default Orders;