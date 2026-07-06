import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api', // Pointing to your Laravel local server
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// This interceptor automatically grabs the token from local storage and adds it to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
