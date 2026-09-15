import { Link,useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";


function Logout() {

  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    navigate("/login");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">You have been logged out.</h2>
        <Link to="/login" className="text-cyan-600 hover:underline">
          Log back in
        </Link>
      </div>
    </div>
  );
}

export default Logout;
