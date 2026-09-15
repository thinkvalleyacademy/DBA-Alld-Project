import { API_URL } from "../config/runtimeConfig";

const normalizeBaseUrl = (value) => (value || "").trim().replace(/\/+$/, "");

export const BASE_URLS = {
  USER: normalizeBaseUrl(API_URL),
};

export const API_ENDPOINTS = {
  USER: {
    LOGIN: "/dba-alld/api/v1/user/login",
    REGISTER: "/dba-alld/api/v1/user/register",
    LIST_USERS: "/dba-alld/api/v1/user/list",
    GET_DETAILS: "/user-management/api/v1/employee/getDetails",
    REFRESH_TOKEN: "/dba-alld/api/v1/user/refresh-token",
    RESET_PASSWORD: "/dba-alld/api/v1/user/reset-password",
  },
  ROLE:{
    LIST: "/dba-alld/api/v1/roles/list",
    SEARCH:"/dba-alld/api/v1/roles/role"
  },
 

  
  MEMBER:{
    SEARCH:"/dba-alld/api/v1/members/search",
    GENERAL_SEARCH:"/dba-alld/api/v1/members/generalsearch",
    REGISTER:"/dba-alld/api/v1/members",
    WELFAREREGISTRER:"/dba-alld/api/v1/members/addWelfare",
    RENEW:"/dba-alld/api/v1/renewSubscription/renew",
    RENEW_QUOTE:"/dba-alld/api/v1/renewSubscription/calculate",
    REGISTRATION_FEE_QUOTE:"/dba-alld/api/v1/members/registration-fee",
    LIST:"/dba-alld/api/v1/members/list",
    UPDATE:"/dba-alld/api/v1/members/updateContact",
    DETAILS:"/dba-alld/api/v1/members/member",
    GMLMSEARCH:"/dba-alld/api/v1/members/search-gm-lm",
    WELFARE_LIST:"/dba-alld/api/v1/members/welfare-list",
    EXPORT_EXCEL:"/dba-alld/api/v1/members/export-excel"

  },

  RECEIPT:{
    LIST:"/dba-alld/api/v1/receipt/list",
    PRINT:"/dba-alld/api/v1/receipt/print"
  },
  VOTER:{
    GMLIST:"/dba-alld/api/v1/voter/gm",
    LMLIST:"/dba-alld/api/v1/voter/lm"
  },
  COMPENSATION:{
    CREATE: "/dba-alld/api/v1/compensation/entry",
    LIST:"/dba-alld/api/v1/compensation/list",
    ENTRY:"/dba-alld/api/v1/compensation/entryDetails",
    MEMBERLIST:"/dba-alld/api/v1/compensation/memberDetails"

  },
  REPORT:{
    STAFF:"/dba-alld/api/v1/report/staff-collection"
  }

 
};

// Assign object to a variable before exporting
const apiConfig = { BASE_URLS, API_ENDPOINTS };

export default apiConfig;
