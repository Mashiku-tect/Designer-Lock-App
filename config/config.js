
import axios from 'axios';

const BASE_URL = 'https://6d278b6c5fda.ngrok-free.app/api'; // <-- Update this once here

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
