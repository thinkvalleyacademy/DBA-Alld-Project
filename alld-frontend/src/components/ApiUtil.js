import { mockLoginApi, mockRegisterApi, mockUsersListApi } from "../mockData/user/mockUserApi";

const useMock = process.env.REACT_APP_USE_MOCK_API === "true";

export const callApi = async ({ url, method = "GET", data = null, headers = {} }) => {
  // console.log("API called and isMocked", url, useMock);
  const isFormData = data instanceof FormData;

  if (useMock) {
    if (url.endsWith("/loginUser")) return mockLoginApi({ url, method, data });
    if (url.endsWith("/register")) return mockRegisterApi({ url, method, data });
    if (url.endsWith("/users")) return mockUsersListApi({ url, method });
  }

  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
      body: data
        ? isFormData
          ? data
          : JSON.stringify(data)
        : null,
    });

    const result = await res.json();

    if (!res.ok || result.status !== 200) {
      throw new Error(result.message || "API error");
    }

    return result;
  } catch (err) {
    throw new Error(err.message || "Network error");
  }
};
