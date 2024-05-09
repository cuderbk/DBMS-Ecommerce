import React, { useEffect, useState } from 'react'
import { Products,Feature } from '../components'
import { fetchProducts } from '../api/api.js'


const Home = () => {

  const [data, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts().then(data => {
        if (data) {
            setProducts(data);
        }
    });
}, []);

  return (
    <div>
      <Feature product = {data[0]}/>
      <Products products = {data}/>
    </div>
  )
}

export default Home