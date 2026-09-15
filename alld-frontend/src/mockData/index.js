import { mockLoginApi, mockRegisterApi, mockUsersListApi } from "./user/mockUserApi";

const mockApi = async ({ url, method, data }) => {
  if (url.endsWith("/loginUser")) return mockLoginApi({ url, method, data });
  if (url.endsWith("/register")) return mockRegisterApi({ url, method, data });
  if (url.endsWith("/users")) return mockUsersListApi({ url, method });

  throw new Error("No matching mock API found for this endpoint");
};

export default mockApi;
