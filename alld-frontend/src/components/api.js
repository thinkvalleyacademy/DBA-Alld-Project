import axios from 'axios';
import { BASE_URLS, API_ENDPOINTS } from '../constants/apiConfig';

// Use centralized base URL from apiConfig for all environments.
// If REACT_APP_API_URL is '/api', apiConfig already resolves proxy mode.
const getBaseURL = () => BASE_URLS.USER || '';

const api = axios.create({
  baseURL: getBaseURL(),
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    console.log(`🚀 ${config.method?.toUpperCase()} Request:`, {
      url: config.url,
      baseURL: config.baseURL,
      hasToken: !!accessToken
    });
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - MODIFIED to handle POST endpoints
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // List of public endpoints that don't require authentication
    // Include both GET and POST endpoints
    const publicEndpoints = [
      '/api/v1/members/search',        // GET endpoint
      '/api/v1/members/member',        // POST endpoint
      '/api/v1/members/list',           // GET endpoint
      '/api/v1/members/search-gm-lm'    // GET endpoint
    ];
    
    // Check if this is a public endpoint (check if URL contains any of the public endpoints)
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      originalRequest.url.includes(endpoint)
    );

    console.log('Error response:', {
      url: originalRequest.url,
      method: originalRequest.method,
      status: error.response?.status,
      isPublicEndpoint,
      message: error.message
    });

    // If error status is 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // For public endpoints, don't try to refresh token or redirect
      if (isPublicEndpoint) {
        console.log("Public endpoint returned 401, but not redirecting");
        return Promise.reject(error);
      }
      
      // For protected endpoints, proceed with token refresh
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then((accessToken) => {
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          return api(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      isRefreshing = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        isRefreshing = false;
        processQueue(error, null);
        // Only redirect for protected endpoints
        if (!isPublicEndpoint) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const refreshEndpoint = API_ENDPOINTS.USER.REFRESH_TOKEN;
        const response = await axios.post(
          `${getBaseURL()}${refreshEndpoint}`, 
          { refreshToken: refreshToken }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken, ...userData } = response.data.data;

        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        localStorage.setItem('user', JSON.stringify(userData));

        isRefreshing = false;
        processQueue(null, newAccessToken);

        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        // Only redirect for protected endpoints
        if (!isPublicEndpoint) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
