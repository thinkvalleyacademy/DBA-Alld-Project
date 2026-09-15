import { FaBars, FaMoon, FaSun } from "react-icons/fa";
import { useEffect, useState, useRef } from "react";
import { SlEnvolope } from "react-icons/sl";

import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Header({ onToggleSidebar }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name = "") => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <header
      className="relative z-[60] px-4 py-3 border-b border-gray-200 dark:border-gray-800 shadow-md flex items-center justify-between bg-white dark:bg-gray-900 print:hidden"
      style={{ backgroundColor: "#5F5CA3" }}
    >
      {/* Left: Logo + Menu */}
      <div className="flex items-center gap-4 ">
        <h1 className="text-2xl font-semibold text-white">DBA SOFTWARE</h1>
        <button
          type="button"
          className="md:hidden justify-start ml-10"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSidebar();
          }}
          aria-label="Open menu"
        >
          <FaBars className="text-xl text-white dark:text-red" />
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4 relative">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            className="text-gray-600 dark:text-gray-200 hover:text-cyan-500 mt-1"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <SlEnvolope className="text-2xl text-white dark:text-red" />

            {/* TODO: Add notification count method */}
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
              0
            </span>
          </button>

          {/* TODO: Add notification dropdown */}
          {/* {showNotifications && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-50">
              <div className="p-3 border-b dark:border-gray-700 font-semibold">
                Notifications
              </div>
              <ul className="text-sm divide-y divide-gray-100 dark:divide-gray-700">
                <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                  📢 New update available
                </li>
                <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                  🔔 User signed in
                </li>
                <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                  ✅ Backup completed
                </li>
              </ul>
            </div>
          )} */}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 text-white hover:text-cyan-500"
          >
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm">
              {getInitials(user?.name)}
            </div>
            <p className="hidden sm:block">{user?.name}</p>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-md z-50">
              {/* <Link
                to="/profile"
                className="block px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Profile
              </Link> */}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-red-400"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          className="text-gray-800 dark:text-gray-100 hover:text-cyan-400 transition"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? (
            <FaSun className="text-lg" />
          ) : (
            <FaMoon className="text-lg" />
          )}
        </button>
      </div>
    </header>
  );
}

export default Header;
