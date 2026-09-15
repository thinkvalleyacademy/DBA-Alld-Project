import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUser,
  FaFile,
  FaChevronDown,
  FaTimes,
  FaFileAlt,
  FaKey,
  FaUserShield,
} from "react-icons/fa";
import { RiUserStarFill } from "react-icons/ri";
import { MdHowToVote } from "react-icons/md";
import { FaPeopleGroup } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react"; // Added useRef

const menuConfig = [
  {
    label: "Dashboard",
    icon: <FaTachometerAlt />,
    path: "/",
  },
  {
    label: "General Member",
    icon: <FaFile />,
    subMenu: [
      { label: "Add Member", path: "/genmember/add" },
      { label: "Member list", path: "/member/list" },
      { label: "Search", path: "/member/search" },
      { label: "Renew Subscription", path: "/member/renew" },
    ],
  },
  {
    label: "Life Member",
    icon: <FaUser />,
    subMenu: [
      { label: "Add Member", path: "/lifemember/add" },
      { label: "Member list", path: "/lifemember/list" },
      { label: "Search", path: "/lifemember/search" },
    ],
  },
  {
    label: "Welfare Member",
    icon: <RiUserStarFill />,
    subMenu: [
      { label: "Add Member", path: "/welfmember/add" },
      { label: "Member list", path: "/welfmember/list" },
      { label: "Search", path: "/welfmember/search" },
      { label: "Compensation", path: "/welfmember/compensation" },
    ],
  },
  {
    label: "User Management",
    icon: <FaPeopleGroup />,
    subMenu: [
      { label: "Registrations", path: "/user/registration" },
      {
        label: "User List",
        path: "/user/list",
      },
    ],
  },
  {
    label: "Voter List",
    icon: <MdHowToVote />,
    subMenu: [
      { label: "General Member Voter List", path: "/voter/GMVoter" },
      // { label: "Previous General Member", path: "/voter/PrevGMVoter" },
      { label: "Life Member Voter List", path: "/voter/LMVoter" },
    ],
  },
  {
    label: "Reports",
    icon: <FaFileAlt />,
    subMenu: [
      // { label: "Members Registration Report", path: "/reports/members-registration" },
      // { label: "Members Subscription Report", path: "/reports/members-subscription" },
      // { label: "Expired Member Report", path: "/reports/expired-members" },
      // { label: "Expense Report", path: "/reports/expense" },
      // { label: "Income Report", path: "/reports/income" },
      // { label: "Account Report", path: "/reports/account" },
      // { label: "Print Data", path: "/reports/print-data" },
      // { label: "Print General Members", path: "/reports/print-general-members" },
      // { label: "Print Life Member", path: "/reports/print-life-member" },
      { label: "Staff Collection Report", path: "/components/staff-collection" },
      { label: "Public Notice Images", path: "/public-notices/manage" },
      // { label: "Wakalatnama Report", path: "/reports/wakalatnama" },
      // { label: "Parcha Report", path: "/reports/parcha" },
      // { label: "Affidavit Report", path: "/reports/affidavit" },
    ],
  },
  {
    label: "Super-Admin",
    icon: <FaUserShield />,
    subMenu: [
      { label: "Master List", path: "/admin/master-list" },
      { label: "Member Edit", path: "/admin/member-edit" },
      { label: "Duplicate Member List", path: "/admin/duplicates" },
    ],
  },
  {
    label: "Change Password",
    icon: <FaKey />,
    path: "/change-password",
  },
];

function Sidebar({ isOpen, onClose, showDetailsModal }) {
  const [openMenus, setOpenMenus] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();
  const submenuRefs = useRef({}); // Ref to track submenu containers

  useEffect(() => {
    const checkDevice = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (!mobile && isOpen) {
        onClose();
      }
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => window.removeEventListener("resize", checkDevice);
  }, [isOpen, onClose]);

  const toggleSubMenu = (label) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const handleItemClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  // Close sidebar on Escape (mobile)
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen && isMobile) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isMobile, onClose]);

  // Function to check if submenu needs scrolling
  const checkSubmenuHeight = (label, isOpen) => {
    if (isOpen && submenuRefs.current[label]) {
      const submenu = submenuRefs.current[label];
      const maxHeight = 200; // Maximum height before scrolling (adjust as needed)
      const actualHeight = submenu.scrollHeight;
      
      if (actualHeight > maxHeight) {
        submenu.style.maxHeight = `${maxHeight}px`;
        submenu.style.overflowY = 'auto';
      } else {
        submenu.style.maxHeight = 'none';
        submenu.style.overflowY = 'hidden';
      }
    }
  };

  return (
    <>
      {/* Mobile Overlay - Conditional rendering and z-index */}
      {isOpen && isMobile && !showDetailsModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Dynamic z-index based on modal state */}
      <aside
        className={`
          w-64 bg-white dark:bg-gray-900 shadow-lg
          fixed md:sticky md:top-0 left-0
          transform transition-all duration-300 ease-in-out
          top-0 bottom-0
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} 
          ${showDetailsModal ? "hidden md:block" : ""}
        `}
        style={{
          height: "100vh",
          zIndex: showDetailsModal ? 40 : 50,
        }}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header with Close Button - Only on Mobile */}
          <div className="flex-shrink-0 flex items-center justify-between p-3 md:hidden border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              DBA Menu
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="Close sidebar"
            >
              <FaTimes className="text-gray-600 dark:text-gray-300 text-lg" />
            </button>
          </div>

          {/* Navigation Menu - Takes all available space */}
          <nav className="flex-1 p-2 space-y-0 overflow-y-auto">
            {menuConfig.map((item) => {
              // Hide Super-Admin menu for non-admin users
              if (item.label === "Super-Admin" && user?.roleId !== 1) {
                return null;
              }

              return item.subMenu ? (
                <div key={item.label} className="mb-1">
                  {/* Submenu Button */}
                  <button
                    onClick={() => toggleSubMenu(item.label)}
                    className="flex w-full items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-gray-500 dark:text-gray-400 text-base">
                        {item.icon}
                      </span>
                      <span className="text-left">{item.label}</span>
                    </span>
                    <FaChevronDown
                      className={`transition-transform duration-200 text-gray-400 ${
                        openMenus[item.label] ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Submenu Items with Smooth Animation */}
                  <div
                    ref={(el) => (submenuRefs.current[item.label] = el)}
                    className={`overflow-hidden transition-all duration-300 ${
                      openMenus[item.label]
                        ? "max-h-[200px] opacity-100" // Fixed max height for scrolling
                        : "max-h-0 opacity-0"
                    }`}
                    style={{
                      overflowY: openMenus[item.label] ? 'auto' : 'hidden',
                      scrollbarWidth: 'thin', // Firefox
                      scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent', // Firefox
                    }}
                    onTransitionEnd={() => checkSubmenuHeight(item.label, openMenus[item.label])}
                  >
                    {/* Custom scrollbar styling that hides but allows scrolling */}
                    <style jsx>{`
                      .submenu-scroll::-webkit-scrollbar {
                        width: 4px;
                      }
                      .submenu-scroll::-webkit-scrollbar-track {
                        background: transparent;
                      }
                      .submenu-scroll::-webkit-scrollbar-thumb {
                        background-color: rgba(156, 163, 175, 0.3);
                        border-radius: 2px;
                      }
                      .submenu-scroll::-webkit-scrollbar-thumb:hover {
                        background-color: rgba(156, 163, 175, 0.5);
                      }
                    `}</style>
                    
                    {openMenus[item.label] && (
                      <div className="ml-6 border-l-2 border-gray-200 dark:border-gray-600 pl-3 py-1 submenu-scroll">
                        {item.subMenu
                          .filter((sub) => {
                            // Hide "Add Member" except for admin and manager
                            if (sub.label === "Add Member" && user?.roleId !== 1 && user?.roleId !== 3) {
                              return false;
                            }
                            // Hide "Super-Admin" submenu items except for admin
                            if (item.label === "Super-Admin" && user?.roleId !== 1) {
                              return false;
                            }
                            return true;
                          })
                          .map((sub) => (
                            <NavLink
                              to={sub.path}
                              key={sub.path}
                              onClick={handleItemClick}
                              className={({ isActive }) =>
                                `block px-3 py-1.5 mb-1 text-sm rounded-lg transition-all duration-200 ${
                                  isActive
                                    ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-100 shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                                }`
                              }
                            >
                              {sub.label}
                            </NavLink>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Single Menu Item
                <NavLink
                  to={item.path}
                  key={item.label}
                  onClick={handleItemClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 mb-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-100 shadow-sm"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`
                  }
                >
                  <span className="text-gray-500 dark:text-gray-400 text-base">
                    {item.icon}
                  </span>
                  <span className="text-left">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar Footer - Minimal padding */}
          <div className="flex-shrink-0 p-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              <p>Version 1.0.0</p>
              <p>© 2024 DBA System</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
