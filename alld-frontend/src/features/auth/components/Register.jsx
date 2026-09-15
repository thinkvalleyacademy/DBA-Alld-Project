import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Spinner from "../../../components/Spinner";
import apiService from "../../../components/apiService";

function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("superadmin");
  const [gender, setGender] = useState("Male");
  const [address, setAddress] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await apiService.register({
        firstName,
        lastName,
        email,
        password,
        userType,
        gender,
        address,
      });


      if (result.status === 200) {
        alert("Registration successful! Please log in.");
        navigate("/login");
      } else {
        setError(result.data?.error || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <form
        onSubmit={handleRegister}
        className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-sm"
      >
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Register</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}

        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full mb-3 px-4 py-2 rounded border bg-gray-50 dark:bg-gray-700"
          required
        />

        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full mb-3 px-4 py-2 rounded border bg-gray-50 dark:bg-gray-700"
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 px-4 py-2 rounded border bg-gray-50 dark:bg-gray-700"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 px-4 py-2 rounded border bg-gray-50 dark:bg-gray-700"
          required
        />

        <select
          value={userType}
          onChange={(e) => setUserType(e.target.value)}
          className="w-full mb-3 px-4 py-2 rounded border bg-gray-50 dark:bg-gray-700"
        >
          <option value="superadmin">Superadmin</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>

        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="w-full mb-3 px-4 py-2 rounded border bg-gray-50 dark:bg-gray-700"
        >
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full mb-4 px-4 py-2 rounded border bg-gray-50 dark:bg-gray-700"
          required
        />

        <button
          type="submit"
          className="w-full bg-cyan-600 text-white py-2 rounded hover:bg-cyan-700 flex justify-center items-center"
          disabled={loading}
        >
          {loading ? <Spinner /> : "Register"}
        </button>

        <div className="mt-4 text-sm text-center text-gray-600 dark:text-gray-300">
          Already have an account?{" "}
          <Link to="/login" className="text-cyan-500 hover:underline">
            Login
          </Link>
        </div>
      </form>
    </div>
  );
}

export default Register;
