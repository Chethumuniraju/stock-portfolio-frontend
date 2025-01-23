import axios from 'axios';

// Get the backend URL from environment variables, fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const searchStocks = async (query) => {
  const response = await api.get(`/stocks/search?symbol=${query}`);
  return response.data.filter(stock => stock.country === 'United States');
};

export const getStockData = async (symbol, interval = '1h') => {
  const response = await api.get(`/stocks/${symbol}/data?interval=${interval}`);
  return response.data;
};

export const getQuote = async (symbol) => {
  const response = await api.get(`/stocks/${symbol}/quote`);
  return response.data;
};

export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    console.log('Login API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Login API error:', error.response?.data);
    throw error;
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    console.log('Register API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Register API error:', error.response?.data);
    throw error;
  }
};

export default api; 