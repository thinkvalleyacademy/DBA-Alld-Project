import { API_URL } from "../config/runtimeConfig";

const normalizeBaseUrl = (value) => (value || "").trim().replace(/\/+$/, "");

export const BASE_URLS = {
  USER: normalizeBaseUrl(API_URL),
};

export const API_ENDPOINTS = {
  USER: {
    LOGIN: "/api/v1/user/login",
    REGISTER: "/api/v1/user/register",
    LIST_USERS: "/api/v1/user/list",
    GET_DETAILS: "/user-management/api/v1/employee/getDetails",
    REFRESH_TOKEN: "/api/v1/user/refresh-token",
    RESET_PASSWORD: "/api/v1/user/reset-password",
  },
  ROLE:{
    LIST: "/api/v1/roles/list",
    SEARCH:"/api/v1/roles/role"
  },
 

  
  MEMBER:{
    SEARCH:"/api/v1/members/search",
    GENERAL_SEARCH:"/api/v1/members/generalsearch",
    REGISTER:"/api/v1/members",
    WELFAREREGISTRER:"/api/v1/members/addWelfare",
    RENEW:"/api/v1/renewSubscription/renew",
    RENEW_QUOTE:"/api/v1/renewSubscription/calculate",
    REGISTRATION_FEE_QUOTE:"/api/v1/members/registration-fee",
    LIST:"/api/v1/members/list",
    UPDATE:"/api/v1/members/updateContact",
    DETAILS:"/api/v1/members/member",
    GMLMSEARCH:"/api/v1/members/search-gm-lm",
    WELFARE_LIST:"/api/v1/members/welfare-list",
    EXPORT_EXCEL:"/api/v1/members/export-excel"

  },

  RECEIPT:{
    LIST:"/api/v1/receipt/list",
    PRINT:"/api/v1/receipt/print"
  },
  VOTER:{
    GMLIST:"/api/v1/voter/gm",
    LMLIST:"/api/v1/voter/lm"
  },
  COMPENSATION:{
    CREATE: "/api/v1/compensation/entry",
    LIST:"/api/v1/compensation/list",
    ENTRY:"/api/v1/compensation/entryDetails",
    MEMBERLIST:"/api/v1/compensation/memberDetails"

  },
  REPORT:{
    STAFF:"/api/v1/report/staff-collection"
  }

 
};

// Assign object to a variable before exporting
const apiConfig = { BASE_URLS, API_ENDPOINTS };

export default apiConfig;
