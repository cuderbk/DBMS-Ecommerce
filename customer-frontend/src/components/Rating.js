import React, { useState } from 'react';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';

function Rating() {
  const [rating, setRating] = useState(0);

  const handleClick = (rate) => {
    setRating(rate);
  };

  return (
    <div className='stars flex space-x-2'>
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
  );
}

export default Rating;