import { createContext, useContext, useState, useEffect } from "react";
import { callApi } from "../components/ApiUtil";

// Create context
const UserReportContext = createContext();

// Provider
export const UserReportProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await callApi({
          url: "/users",
          method: "GET",
        });

        setUsers(result.data || []);
      } catch (err) {
        setError(err.message || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <UserReportContext.Provider value={{ users, loading, error }}>
      {children}
    </UserReportContext.Provider>
  );
};

// Custom hook for easy access
export const useUserReport = () => useContext(UserReportContext);
