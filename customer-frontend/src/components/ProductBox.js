import { useContext } from "react";
import { CartContext } from "./CartContext";

export default function ProductBox({ id, title,description, price, image }) {
  const { addProduct } = useContext(CartContext);
  const url = '/product/' + id;
  return (
    <div className="m-5">
      <a href={url} className="bg-white p-5 h-32 text-center flex items-center justify-center rounded-lg">
        <div>
          <img className="max-w-full max-h-20" src={image ? image : 'https://via.placeholder.com/300'} alt="" />
        </div>
      </a>
      <div className="mt-1">
        <a href={url} className="font-semibold text-black text-base no-underline m-0">{title.substring(0, 25)}</a>
        <div className="flex gap-1 items-center justify-between mt-1">
          <div className="text-base font-medium text-right md:text-left md:text-xl md:font-bold">
            ${price ? price : 'Null'}
          </div>
          <button 
            className="bg-white text-[#1d564c] font-medium py-2 px-2 rounded border-2 border-[#1d564c]"
            onClick={() => addProduct(id)}  
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}