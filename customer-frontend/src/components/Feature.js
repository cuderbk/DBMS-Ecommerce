import React, {useContext} from 'react'
import {IoMdCart} from 'react-icons/io'
import {CartContext} from './CartContext'
export default function Feature({product}) {
    const {addProduct} = useContext(CartContext);
    function addFeaturedToCart() {
        addProduct(product.id);
    }
    return (
        <div className="">
            <div className="bg-[#333] justify-center text-[#fff] font-medium py-12 px-16 ">
                <div className="grid grid-cols-2 justify-center">
                    <div className="pl-16 order-1">
                    <h1 className="font-bold mb-2 text-4xl">{product && product.title ? product.title : 'Loading...'}</h1>
                    <p className="text-[#aaa] text-lg">
                    {product && product.description ? product.description : 'Loading...'}
                    </p>
                    <div className="flex gap-2 mt-6">
                        <a href={'/'} className="border border-white text-white py-2 px-4 rounded">
                            Read more
                        </a>
                        <button 
                            className="bg-white text-[#333] py-2 px-4 rounded font-semibold flex gap-2"
                            onClick={addFeaturedToCart}
                        >
                            <IoMdCart size={'1.5rem'} color={'#333'}/>
                            Add to cart
                        </button>
                    </div>
                    </div>
                    <div className="order-2">
                        <img className="mx-auto max-w-full max-h-80" src={product && product.image ? product.image : 'https://via.placeholder.com/300'} alt={product && product.title ? product.title : 'Loading...'} />
                    </div>
                </div>
            </div>
        </div>
    );
}

