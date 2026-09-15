import { useEffect, useState } from "react";
import { getUsers } from "../../apiService";
import { BASE_URLS, API_ENDPOINTS } from "../../constants/apiConfig";

export function useUsers({ userType, grade, section }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!userType || (userType === "student" && (!grade || !section))) return;

      try {
        setLoading(true);
        const query = userType === "student"
          ? `?userType=student&grade=${grade}&section=${section}`
          : `?userType=${userType}`;

        const res = await getUsers({
          url: `${BASE_URLS.USER}${API_ENDPOINTS.LIST_USERS}${query}`,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });

        setUsers(res.data || []);
      } catch (err) {
        console.error(`Error fetching ${userType}s:`, err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [userType, grade, section]);

  return { users, loading };
}
