import {createContext, useEffect, useState} from "react";

export const CartContext = createContext({});

export function CartContextProvider({children}) {
    const ls = typeof window !== "undefined" ? window.localStorage : null;
    const [cartProducts,setCartProducts] = useState([]);
    useEffect(() => {
        if (ls && ls.getItem('cart')) {
          setCartProducts(JSON.parse(ls.getItem('cart')));
          console.log(JSON.parse(ls.getItem('cart')));
        }
      }, []);
    function addProduct(productId) {
        console.log(productId);
        setCartProducts(prev => [...prev,productId]);
        ls?.setItem('cart', JSON.stringify([...cartProducts,productId]));
    }
    
    function removeProduct(productId) {
      setCartProducts(prev => {
        const pos = prev.indexOf(productId);
        if (pos !== -1) {
          ls?.setItem('cart', JSON.stringify(prev.filter((value,index) => index !== pos)));
          return prev.filter((value,index) => index !== pos);
        }
        return prev;
      });
  }

    function clearCart() {
      setCartProducts(() => []);
      ls?.removeItem('cart');
    }

    return (
        <CartContext.Provider value={{cartProducts,setCartProducts,addProduct,removeProduct,clearCart}}>
          {children}
        </CartContext.Provider>
      );
}