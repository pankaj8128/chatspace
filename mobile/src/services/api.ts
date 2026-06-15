import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// CRITICAL: Localhost mapping for Android Emulator.
// Android Emulator maps localhost (127.0.0.1) to its internal loopback.
// To reach the development machine's server, use 10.0.2.2.
const BASE_URL = __DEV__ ? 'http://10.0.2.2:5000/api' : 'https://chatspace-xd13.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request asynchronously
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error fetching token from AsyncStorage', error);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
