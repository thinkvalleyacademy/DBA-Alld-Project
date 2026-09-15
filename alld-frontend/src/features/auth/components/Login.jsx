import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Spinner from "../../../components/Spinner";
import apiService from "../../../components/apiService";
import { FaEye, FaEyeSlash } from "react-icons/fa";

// Heroicons v2.1.3 - MIT License
const UserIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

const LockClosedIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
);

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [userId, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiService.login({ userId, password });
      if (response.status === 200 && response.data.status === 200) {
        login(response.data.data);
        navigate("/");
      } else {
        setError(response.data.message || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 bg-gradient-to-br from-gray-900 via-gray-800 to-black transition-colors duration-500">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle_500px_at_50%_300px,#1e293b,transparent)]"></div>
      </div>
      
      <main className="relative z-10 animate-fade-in w-full max-w-md p-4">
        {error && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[150%] w-full max-w-sm bg-red-500/10 backdrop-blur-sm border border-red-500/20 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-slide-down text-center font-medium">
            {error}
          </div>
        )}

        <div className="flex flex-col items-center mb-8">
             <img src="/image.png" alt="DBA Software Logo" className="h-24 w-24 object-contain" />
          <h1 className="text-4xl font-bold text-white tracking-wider animate-glow">
            DBA Software
          </h1>
          <p className="text-gray-400 mt-2">Enterprise Access Portal</p>
        </div>

        <div className="relative p-1 rounded-2xl bg-gradient-to-b from-white/10 to-transparent">
          <div className="bg-gray-900/50 backdrop-blur-xl p-8 rounded-[15px] shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-white text-center">
              Sign In
            </h2>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="UserID"
                  value={userId}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-lg rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-300"
                  required
                />
              </div>

              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 text-lg rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg text-lg font-semibold flex justify-center items-center transition-all duration-300 shadow-lg hover:shadow-cyan-500/30 transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none"
                disabled={loading}
              >
                {loading ? <Spinner /> : "Login"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
