import { React, useState, useEffect, createContext } from 'react';
const UserContext = createContext(null);
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    isAuthenticated: false,
    token: '',
    email: ''
  });
  useEffect(() => {
    let session = sessionStorage.getItem('token');
    let email = sessionStorage.getItem('email');
    let id = sessionStorage.getItem('id');
    console.log('token', session);
    if (session) {
      setUser({
        isAuthenticated: true,
        token: session,
        email: email,
        id: id
      });
    }
  }, []);

  const login = (email, id, token) => {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('email', email);
    sessionStorage.setItem('id', id);
    console.log('login', token);
    setUser({
      isAuthenticated: true,
      token: token,
      email: email
    });
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('email');
    sessionStorage.removeItem('id');
    setUser({
      isAuthenticated: false,
      token: '',
      email: '',
      id: ''
    });
  };
  
  return <UserContext.Provider value={{ user, setUser, login, logout }}>{children}</UserContext.Provider>;
};
export default UserContext;
