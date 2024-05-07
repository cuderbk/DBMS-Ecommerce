import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import {IoMdCart} from 'react-icons/io'
import { CartContext } from '../components/CartContext';
import { Rating } from '../components';
import axios from 'axios';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const {addProduct} = useContext(CartContext);
  function addFeaturedToCart() {
    addProduct(product.id);
}
  useEffect(() => {
    axios.get(`http://localhost:8040/${id}`)
      .then(response => {
        setProduct(response.data);
      })
      .catch(error => {
        console.log('Error fetching product details', error);
      });
  }, [id]);
  if (!product) {
    return <div className='w-3/5 m-auto min-h-screen'>Loading...</div>;
  }
  return (
    <div className='w-3/5 m-auto min-h-screen'>
      <div className='flex items-center my-10 space-x-10'>
        <div className='w-[500px] h-[500px]'>
          <img className='w-full' src={product.image ? product.image : 'https://via.placeholder.com/300'} alt={product.name}/>
        </div>
        <div className='w-1/2 space-y-10'>
          <h1 className='text-4xl font-bold'>{product.name}</h1>
          <h2 className='text-2xl font-semibold'>${product.price}</h2>
          <p>{product.description}
          </p>
          <Rating/>
          <div className='btns space-x-5'>
            <button 
              className='bg-stone-800 text-white py-2 px-4 rounded font-semibold flex gap-2'
              onClick={addFeaturedToCart}
            >
              <IoMdCart size={'1.5rem'} color={'white'}/>
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail