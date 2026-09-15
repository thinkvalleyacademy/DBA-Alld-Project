

import axios from 'axios';
import { BASE_URLS, API_ENDPOINTS } from "../constants/apiConfig";

const publicApi = axios.create({
  baseURL: BASE_URLS.USER || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});


publicApi.interceptors.request.use(
  (config) => {
    console.log('🚀 Public API Request:', {
      url: config.url,
      method: config.method,
      params: config.params,
      data: config.data
    });
    
    delete config.headers.Authorization;
    return config;
  },
  (error) => Promise.reject(error)
);

publicApi.interceptors.response.use(
  (response) => {
    console.log('Public API Response:', {
      url: response.config.url,
      status: response.status
    });
    return response;
  },
  (error) => {
    console.error('❌ Public API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

const publicApiService = {
 
  memberSearch: (searchParams) => publicApi.get(API_ENDPOINTS.MEMBER.SEARCH, {
    params: searchParams,
  }),

 
  generalMemberSearch: (searchParams) => publicApi.get(API_ENDPOINTS.MEMBER.GENERAL_SEARCH, {
    params: searchParams,
  }),

 
  memberDetails: (memberId) => publicApi.post(`${API_ENDPOINTS.MEMBER.DETAILS}?id=${memberId}`),

  gmlmSearch: (searchParams) => publicApi.get(API_ENDPOINTS.MEMBER.GMLMSEARCH, {
    params: searchParams,
  }),

  memberList: (params) => publicApi.get(API_ENDPOINTS.MEMBER.LIST, {
    params: params,
  }),

  getPublicNoticeImages: () => publicApi.get(API_ENDPOINTS.PUBLIC_NOTICE.LIST_PUBLIC),

  get: (url, config = {}) => publicApi.get(url, config),
  post: (url, data = {}, config = {}) => publicApi.post(url, data, config),
  put: (url, data = {}, config = {}) => publicApi.put(url, data, config),
  delete: (url, config = {}) => publicApi.delete(url, config),
};

export default publicApiService;
