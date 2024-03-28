import React, { useEffect, useState } from 'react'
import { Hero,Categories,Products,TopProducts,Feature } from '../components'


const Home = () => {

  const [data, setProducts] = useState([]);

  useEffect(() => {
    fetch('https://fakestoreapi.com/products')
      .then(res => res.json())
      .then(json => setProducts(json))
  }, []);

  return (
    <div>
      <Feature product = {data[0]}/>
      <Products products = {data}/>
    </div>
  )
}

export default Home