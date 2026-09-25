import api from "./api";
import { API_ENDPOINTS } from "../constants/apiConfig";

const apiService = {
  login: (data) => api.post(API_ENDPOINTS.USER.LOGIN, data),
  register: (data) => api.post(API_ENDPOINTS.USER.REGISTER, data),
  resetPassword: (data) => api.post(API_ENDPOINTS.USER.RESET_PASSWORD, data),
  listUsers: () => api.post(API_ENDPOINTS.USER.LIST_USERS),
  listRoles: () => api.get(API_ENDPOINTS.ROLE.LIST),
  searchRole: (id) => api.get(API_ENDPOINTS.ROLE.SEARCH, {
    params: { id },
  }),
  memberSearch: (searchParams) => api.get(API_ENDPOINTS.MEMBER.SEARCH, {
    params: searchParams,
  }),
  memberList: (params) => api.get(API_ENDPOINTS.MEMBER.LIST, {
    params: params,
  }),
  memberUpdate: (memberData) => api.put(API_ENDPOINTS.MEMBER.UPDATE, memberData),
  memberUpdateWithFile: (formDataToSend) =>
    api.put(
      API_ENDPOINTS.MEMBER.UPDATE,
      formDataToSend,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      }
    ),

  memberDetails: (memberId) => api.post(`${API_ENDPOINTS.MEMBER.DETAILS}?id=${memberId}`),
  gmlmSearch: (searchParams) => api.get(API_ENDPOINTS.MEMBER.GMLMSEARCH, {
    params: searchParams,
  }),
  memberRenewQuote: (postData) => api.post(API_ENDPOINTS.MEMBER.RENEW_QUOTE, postData),
  memberRenew: (postData) => api.post(API_ENDPOINTS.MEMBER.RENEW, postData),
  memberRegistrationFeeQuote: (postData) =>
    api.post(API_ENDPOINTS.MEMBER.REGISTRATION_FEE_QUOTE, postData),

  affidavitList: () => api.get(API_ENDPOINTS.AFFIDAVIT.LIST),

  memberRegister: (formDataToSend) =>
    api.post(
      API_ENDPOINTS.MEMBER.REGISTER,
      formDataToSend,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      }
    ),

  welfareRegister: (welfareData) => api.post(API_ENDPOINTS.MEMBER.WELFAREREGISTRER, welfareData),

  receiptList: (memberId) => api.post(`${API_ENDPOINTS.RECEIPT.LIST}?memberId=${memberId}`),

  receiptPrint: (memberId, userId) => api.post(`${API_ENDPOINTS.RECEIPT.PRINT}?memberId=${memberId}&userId=${userId}`, {
    params: { memberId, userId },
  }),

  lmList: (params) => api.get(API_ENDPOINTS.VOTER.LMLIST, {
    params: params,
  }),

  gmList: (params) => api.get(API_ENDPOINTS.VOTER.GMLIST, {
    params: params,
  }),

  gmSearch: (params) => api.get(API_ENDPOINTS.VOTER.GMLIST + "/search", {
    params: params,
  }),

  lmSearch: (params) => api.get(API_ENDPOINTS.VOTER.LMLIST + "/search", {
    params: params,
  }),

  lmSearchByMonthYear: (params) => api.get(API_ENDPOINTS.VOTER.LMLIST + "/search/by-month-year", {
    params: params,
  }),

  getUserDetails: (username) => api.post(`${API_ENDPOINTS.USER.GET_DETAILS}?username=${username}`),

  createCompensation: (postData, userId) =>
    api.post(
      API_ENDPOINTS.COMPENSATION.CREATE,
      postData,
      {
        headers: {
          "X-USER-ID": userId,
        },
      }
    ),

  getCompensationList: () => api.post(API_ENDPOINTS.COMPENSATION.LIST),

  getCompensationEntry: (entryId) => api.post(`${API_ENDPOINTS.COMPENSATION.ENTRY}?id=${entryId}`),

  getStaffCollection: (postData) => api.post(API_ENDPOINTS.REPORT.STAFF, postData),

  getCompensationMemberList: (memberID) => api.post(`${API_ENDPOINTS.COMPENSATION.MEMBERLIST}?id=${memberID.trim()}`),

  // Optimized endpoint for welfare member list download
  getWelfareMemberList: (memberType) => api.get(`${API_ENDPOINTS.MEMBER.WELFARE_LIST}?memberType=${memberType}`),

  /**
   * Export members to Excel file (server-side generation)
   * Returns blob data for direct download
   */
  exportMembersToExcel: (params, config = {}) => api.get(API_ENDPOINTS.MEMBER.EXPORT_EXCEL, {
    params: params,
    ...config
  }),

  // Duplicate Members Management
  getDuplicateMembers: (mobileFilter) => {
    const params = mobileFilter ? { mobile: mobileFilter } : {};
    return api.get('/api/v1/members/duplicates', { params });
  },

  updateMemberStatus: (memberId, newStatus) => {
    return api.put(`/api/v1/members/${memberId}/status`, {
      newStatus,
    });
  },

  bulkUpdateMemberStatus: (memberIds, newStatus) => {
    return api.put('/api/v1/members/bulk-status', {
      memberIds,
      newStatus,
    });
  },

};

export default apiService;
