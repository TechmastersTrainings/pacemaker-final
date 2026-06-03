import axios, { 
  AxiosInstance, 
  InternalAxiosRequestConfig, 
  AxiosResponse, 
  AxiosError 
} from 'axios';

const BASE_URL = 'http://localhost:8080/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true // Important for cookies if used, or just to match backend config
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Handle Auto-token refresh from headers if backend sends it
    const newToken = response.headers['authorization'];
    if (newToken && typeof window !== 'undefined') {
       const bare = newToken.replace('Bearer ', '');
       localStorage.setItem('token', bare);
    }

    // Standardized Unwrapping logic
    const data = response.data;
    if (data && typeof data === 'object' && 'success' in data) {
      if (data.success === false) {
         return Promise.reject(new Error(data.message || 'Server error'));
      }
      return { ...response, data: data.data };
    }
    return response;
  },
  (error: AxiosError<any>) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timed out.'));
    }
    if (!error.response) {
      return Promise.reject(new Error('Backend server is unreachable. Please ensure the Spring Boot app is running on port 8080.'));
    }

    if (error.response.status === 401 && typeof window !== 'undefined') {
       localStorage.removeItem('token');
       localStorage.removeItem('currentUser');
       localStorage.removeItem('userRole');
    }

    const message = error.response.data?.message || `Error ${error.response.status}`;
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
