import axios from "axios";
import { reset } from "./authSlices";


const API_URL = 'http://localhost:8041';
const API = axios.create({baseURL: API_URL})

const register = async (userData) => {
  const response = await API.post("register", userData);
  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
  }

  return { data: response.data};
};

const login = async (userData) => {
  try {
    const response = await API.post("/login", userData);
    if (response.data.accessToken) {
      localStorage.setItem("token", response.data.accessToken);
      return { data: response.data };
    } 
  } catch (error) {
    console.log(error)
  }

  return { data: response.data };
};

const logout = () => {
  localStorage.removeItem("token");
};

const authService = { register, login, logout };

export default authService;
