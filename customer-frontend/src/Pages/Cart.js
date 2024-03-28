import React, {useContext,useState,useEffect} from 'react';
import {CartContext} from '../components/CartContext';

export default function CartPage () {
    const {cartProducts,addProduct, removeProduct} = useContext(CartContext);
    const [products,setProducts] = useState([]);
    const [name,setName] = useState('');
    const [email,setEmail] = useState('');
    const [city,setCity] = useState('');
    const [postalCode,setPostalCode] = useState('');
    const [streetAddress,setStreetAddress] = useState('');
    const [country,setCountry] = useState('');
    const [isSuccess,setIsSuccess] = useState(false);
    function moreOfThisProduct(id) {
        addProduct(id);
    }
    function lessOfThisProduct(id) {
        removeProduct(id);
    }
    let total = 0;
    for (const productId of cartProducts) {
        const price = products.find(p => p.id === productId)?.price || 0;
        total += price;
    }
    useEffect(() => {
        const uniqueCartProducts = [...new Set(cartProducts)].sort((a, b) => a - b);
    
        const productPromises = uniqueCartProducts.map(productId =>
            fetch(`https://fakestoreapi.com/products/${productId}`)
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                })
                .catch(error => console.error('Error fetching product details: ', error))
        );
    
        Promise.all(productPromises)
            .then(products => setProducts(products.filter(product => product !== undefined)))
            .catch(error => console.error('Error with Promise.all: ', error));
    }, [cartProducts]);
    return (
        console.log(products),
        <div className="px-16 min-h-screen">
            <h1 className='text-3xl font-bold my-5'> 
			Cart </h1>
            <div className="grid grid-cols-1 gap-10 mt-10 md:grid-cols-[1.2fr,.8fr]">
                <div className=" bg-white rounded-lg p-8">
                    {!cartProducts?.length && (
                    <div>Your cart is empty</div>
                    )}
                    {products?.length > 0 && (
                        <>
                            <table className="w-full">
                                <thead>
                                <tr>
                                    <th className="text-left uppercase text-gray-400 font-semibold text-md p-2">Product</th>
                                    <th className="text-left uppercase text-gray-400 font-semibold text-md p-2">Quantity</th>
                                    <th className="text-left uppercase text-gray-400 font-semibold text-md p-2">Price</th>
                                </tr>
                                </thead>
                                <tbody>
                                {products.map(product => (
                                    <tr key={product.id}>
                                    <td className="border-t border-gray-200 p-3">
                                        <div className="w-24 h-32 p-1 border border-gray-200 flex items-center justify-center rounded-lg">
                                        <img className="max-w-24 max-h-24 p-1" src={product.image} alt=""/>
                                        </div>
                                        <div className="font-semibold text-xl">
                                            {product.title.substring(0, 20)}
                                        </div>
                                    </td>
                                    <td className="border-t border-gray-200 items-center">
                                        <div className="flex">
                                            <button className='bg-[#e3e3e3] py-1 px-3 rounded font-semibold' onClick={() => lessOfThisProduct(product.id)}>-</button>
                                            <div className='px-4 font-semibold text-xl'>
                                            {cartProducts.filter(id => id === product.id).length}
                                            </div>
                                            <button className='bg-[#e3e3e3] py-1 px-3 rounded font-semibold' onClick={() => moreOfThisProduct(product.id)}>+</button>
                                        </div>
                                    </td>
                                    <td className="border-t border-gray-200 p-3 font-semibold text-xl">
                                        ${(cartProducts.filter(id => id === product.id).length * product.price).toFixed(2)}
                                    </td>
                                    </tr>
                                ))}
                                <tr>
                                    <td className="border-t border-gray-200 items-center"></td>
                                    <td className="border-t border-gray-200 items-center"></td>
                                    <td className='border-t border-gray-200 items-center p-3 font-semibold text-xl'>${total.toFixed(2)}</td>
                                </tr>
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
                {!!cartProducts?.length && (
                    <div className=" bg-white rounded-lg p-8">
                        <h2 className="font-bold text-xl mb-4"> Order Info</h2>
                        <input className="w-full p-2 mb-2 border border-gray-300 rounded box-border" type='text' placeholder='Name' value={name} onChange={e => setName(e.target.value)} name='name' />
                        <input className="w-full p-2 mb-2 border border-gray-300 rounded box-border" type='email' placeholder='Email' value={email} onChange={e => setEmail(e.target.value)} name='email' />
                        <div className='flex gap-2'>
                        <input className="w-full p-2 mb-2 border border-gray-300 rounded box-border" type='text' placeholder='City' value={city} onChange={e => setCity(e.target.value)} name='city' />
                        <input className="w-full p-2 mb-2 border border-gray-300 rounded box-border" type='text' placeholder='Postal Code' value={postalCode} onChange={e => setPostalCode(e.target.value)} name='postalCode' />
                        </div>
                        <input className="w-full p-2 mb-2 border border-gray-300 rounded box-border" type='text' placeholder='Street Address' value={streetAddress} onChange={e => setStreetAddress(e.target.value)} name='streetAddress' />
                        <input className="w-full p-2 mb-2 border border-gray-300 rounded box-border" type='text' placeholder='Country' value={country} onChange={e => setCountry(e.target.value)} name='country' />
                        <button className="bg-black text-white text-md font-base py-2 px-2 rounded mt-4 w-full" > 
                        Continue To Payment
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}