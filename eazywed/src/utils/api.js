import axios from 'axios';
import { toast } from 'react-toastify';

// Create a reusable API instance
const createAPI = (navigate) => {
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
    withCredentials: true,
    timeout: 120000, // 120 second timeout for large uploads
  });
  

  // Add response interceptor to handle auth errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        toast.error("Your session has expired. Please log in again.");
        setTimeout(() => {
          navigate('/vendor/login');
        }, 2000);
      }
      return Promise.reject(error);
    }
  );

  return api;
};

export default createAPI; 