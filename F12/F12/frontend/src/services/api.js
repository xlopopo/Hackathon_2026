import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',  // <-- убираем localhost, nginx сам проксирует
  headers: {
    'Content-Type': 'application/json',
  },
});

// Автоматически добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Если токен истёк – разлогиниваем
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;