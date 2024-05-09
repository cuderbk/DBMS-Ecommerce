import React from 'react';
import {Navbar,Footer} from './components';
import './output.css';
import {BrowserRouter as Router ,Routes,Route} from 'react-router-dom'
import Home from './Pages/Home';
import AllProducts from './Pages/AllProducts';
import { CartContextProvider } from './components/CartContext';
import Cart from './Pages/Cart';
import ProductDetail from './Pages/ProductDetail';
import Login from './Pages/Login';
import Signup from './Pages/Signup';
import { UserProvider } from './components/UserContext';

function App() {
  return (
    <div className='bg-[#ebebeb]'>
      <Router>
        <UserProvider>
          <CartContextProvider>
            <Navbar />
              <Routes>
                <Route path='/' element={<Home/>}> </Route>
                <Route path='/all-products' element={<AllProducts/>}> </Route>
                <Route path='/cart' element={<Cart/>}></Route>
                <Route path='/product/:id' element={<ProductDetail/>} />
                <Route path='/login' element={<Login/>}></Route>
                <Route path='/signup' element={<Signup/>}></Route>
                {/* <Route path="/" element={
        sessionStorage.getItem('token')
        ? <DashBoard /> : <Navigate to="/login" replace />
      } />
      <Route path="/login" element={
      sessionStorage.getItem('token')
      ? <Navigate to="/" replace /> : <Login />
      } />
      <Route path="/signup" element={
      sessionStorage.getItem('token')
      ? <Navigate to="/" replace /> : <SignUp />
      } /> */}
                
              </Routes>
            <Footer />
          </CartContextProvider>
        </UserProvider>
      </Router>
    </div>
  );
}

export default App;
