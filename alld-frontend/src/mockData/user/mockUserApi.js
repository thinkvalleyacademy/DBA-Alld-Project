// mockData/users/mockUserApi.js

export const mockLoginApi = async ({ url, method, data }) => {
  if (url.endsWith("/loginUser") && method === "POST") {
    return {
      status: 200,
      message: "Login Success",
      data: {
        firstName: "Demo",
        lastName: "User",
        userType: "superadmin",
        username: data.username,
        token: "mocked-token-123456",
      },
    };
  }
  throw new Error("Invalid login request");
};

export const mockRegisterApi = async ({ url, method, data }) => {
  if (url.endsWith("/register") && method === "POST") {
    if (!data.email || !data.password || !data.userType) {
      throw new Error("Missing required fields");
    }
    return {
      status: 200,
      message: "Registration successful",
      data: {
        id: Date.now(),
        ...data,
        token: "mock-token-" + Math.random().toString(36).substr(2, 9),
      },
    };
  }
  throw new Error("Invalid registration request");
};

export const mockUsersListApi = async ({ url, method }) => {
  if (url.endsWith("/users") && method === "GET") {
    return {
      status: 200,
      data: [
        { id: 1, name: "Alice", email: "alice@example.com" },
        { id: 2, name: "Bob", email: "bob@example.com" },
        { id: 3, name: "Charlie", email: "charlie@example.com" },
      ],
    };
  }
  throw new Error("Invalid user list request");
};
