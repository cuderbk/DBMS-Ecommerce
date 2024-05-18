import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import {IoMdCart} from 'react-icons/io'
import { CartContext } from '../components/CartContext';
import axios from 'axios';
import { fetchProductById } from '../api/api';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';


const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const {addProduct} = useContext(CartContext);
  const [rating, setRating] = useState(0);

  const handleClick = (rate) => {
    setRating(rate);
  };
  const ratingSubmit = () => {
    console.log(rating);
  };
  function addFeaturedToCart() {
    addProduct(product.id);
}
useEffect(() => {
  fetchProductById(id)
    .then(data => {
      setProduct(data);
    })
    .catch(error => {
      console.log('Error fetching product details', error);
    });
}, [id]);
  if (!product) {
    return <div className='w-3/5 m-auto min-h-screen'>Loading...</div>;
  }
  return (
    <div className='w-3/5 m-auto min-h-screen bg-white p-10'>
      <div className='flex items-center my-10 space-x-10'>
        <div className='w-[500px] h-[500px]'>
          {/* <img className='w-full' src={product.image ? product.image : 'https://via.placeholder.com/300'} alt={product.name}/> */}
          <img className='w-full max-h-[500px]'
          src={ product.image ? product.image : 'https://via.placeholder.com/300'} alt={product.title}/>
        </div>
        <div className='w-1/2 space-y-10'>
          <h1 className='text-4xl font-bold'>{product.title}</h1>
          <h2 className='text-2xl font-semibold'>${product.price}</h2>
          <p>{product.description}
          </p>
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
      <div className='w-full border-t-2 border-gray-200 py-10'>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[.7fr,1.3fr]">
          <div>
            <div className=' flex space-x-2 justify-center items-center flex-col'>
              <div>
              {[...Array(5)].map((star, i) => {
                const ratingValue = i + 1;
                return (
                  <button
                    key={i}
                    className='focus:outline-none'
                    onClick={() => handleClick(ratingValue)}
                  >
                    {ratingValue <= rating ? <AiFillStar className="text-yellow-500" /> : <AiOutlineStar />}
                  </button>
                );
              })}
              </div>
              <button 
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
              onClick={ratingSubmit}
            >
              Submit Rating
            </button>
            </div>
            
          </div>
          <div>
            <div class="text-center text-yellow-400 text-3xl font-bold">4.7/5</div>
            <div class="text-center text-gray-500 text-lg font-bold">1000 reviews</div>
            <div class="flex justify-center gap-5">
              <div class="text-center text-gray-500 text-lg font-semibold">
                <div class="flex items-center">
                  5
                  <AiFillStar className="text-yellow-400" />
                  
                    (5)
                </div>
              </div>
              <div class="text-center text-gray-500 text-lg font-semibold">
                <div class="flex items-center">
                  4
                  <AiFillStar className="text-yellow-400" />
                  (5)
                </div>
              </div>
              <div class="text-center text-gray-500 text-lg font-semibold">
                <div class="flex items-center">
                  3
                  <AiFillStar className="text-yellow-400" />
                  (5)
                </div>
              </div>
              <div class="text-center text-gray-500 text-lg font-semibold">
                <div class="flex items-center">
                  2
                  <AiFillStar className="text-yellow-400" />
                  (5)
                </div>
              </div>
              <div class="text-center text-gray-500 text-lg font-semibold">
                <div class="flex items-center">
                  1
                  <AiFillStar className="text-yellow-400" />
                  (5)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  )
}

export default ProductDetail