import React from 'react';
import {Navbar,Footer} from './components';
import './output.css';
import {BrowserRouter as Router ,Routes,Route} from 'react-router-dom'
import Home from './Pages/Home';
import AllProducts from './Pages/AllProducts';
import { CartContextProvider } from './components/CartContext';
import Cart from './Pages/Cart';
import ProductDetail from './Pages/ProductDetail';

function App() {
  return (
    <div className='bg-[#ebebeb]'>
      <Router>
        <CartContextProvider>
          <Navbar />
            <Routes>
              <Route path='/' element={<Home/>}> </Route>
              <Route path='/all-products' element={<AllProducts/>}> </Route>
              <Route path='/cart' element={<Cart/>}> </Route>
              <Route path='/product/:id' element={<ProductDetail/>} />
            </Routes>
          <Footer />
        </CartContextProvider>
      </Router>
    </div>
  );
}

export default App;
