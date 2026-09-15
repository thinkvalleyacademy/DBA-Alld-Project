import React, { useEffect, useState } from "react";
import { callApi } from "../../../components/ApiUtil";
import { BASE_URLS, API_ENDPOINTS } from '../../../constants/apiConfig';
import PageWrapper from "../../../utility/PageWrapper";

function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      const token = localStorage.getItem("authToken");
      const username = localStorage.getItem("username"); // ✅ You should store username in localStorage at login

      if (!token || !username) {
        console.warn("authToken or username missing");
        return;
      }

      try {
        const result = await callApi({
          method: "POST",
          url: `${BASE_URLS.EMPLOYEE}${API_ENDPOINTS.EMPLOYEE.GET_DETAILS}?username=${username}`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (result?.data) {
          setUser(result.data);
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err.message);
      }
    };

    fetchUserDetails();
  }, []);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-600 dark:text-gray-300">
        Loading profile...
      </div>
    );
  }

  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

  return (
    <PageWrapper>
      <div className="max-w-md mx-auto mt-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-4 mb-4">
          {/* User Image or Initial */}
          {user.userImage ? (
            <img
              src={user.userImage}
              alt="User"
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-cyan-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
              {fullName[0] || "U"}
            </div>
          )}
          {/* User Info */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {fullName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              {user.userType}
            </p>
          </div>
        </div>

        {/* User Details */}
        <div className="text-gray-700 dark:text-gray-300 space-y-2">
          <p><strong>Email:</strong> {user.emailId}</p>
          <p><strong>Date of Birth:</strong> {user.dateOfBirth}</p>
          <p><strong>Contact:</strong> {user.studentMob}</p>
          <p><strong>Father's Name:</strong> {user.fatherName}</p>
          <p><strong>Mother's Name:</strong> {user.motherName}</p>
          <p><strong>Gender:</strong> {user.gender === "1" ? "Male" : user.gender === "2" ? "Female" : "Other"}</p>
          <p><strong>Grade:</strong> {user.grade}</p>
          <p><strong>Section:</strong> {user.section}</p>
          <p><strong>Blood Group:</strong> {user.bloodGroup}</p>
          <p><strong>Address:</strong> {user.address}</p>
          <p><strong>Registration No.:</strong> {user.registrationNumber}</p>
          <p><strong>Status:</strong> {user.userStatus ? "Active" : "Inactive"}</p>
        </div>
      </div>
    </PageWrapper>
  );
}

export default Profile;
