import { useState } from "react";
import PageWrapper from "../../../utility/PageWrapper";
import apiService from "../../../components/apiService";
import { useAuth } from "../../../context/AuthContext";
import { showErrorToast, showSuccessToast } from "../../../utility/toast";

const initialFormState = {
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: "",
};

function ChangePassword() {
  const { user } = useAuth();
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const { currentPassword, newPassword, confirmNewPassword } = formData;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return "All fields are required";
    }

    if (newPassword === currentPassword) {
      return "New password must be different from current password";
    }

    if (newPassword !== confirmNewPassword) {
      return "Confirm password must match new password";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const validationError = validateForm();
    if (validationError) {
      showErrorToast(validationError);
      return;
    }

    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user?.userId || storedUser?.userId;

    if (!userId) {
      showErrorToast("User not found");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        userId,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      };

      const response = await apiService.resetPassword(payload);
      const successMessage =
        response?.data?.message || "Password reset successful";

      showSuccessToast(successMessage);
      setFormData(initialFormState);
    } catch (error) {
      const status = error?.response?.status;
      const backendMessage = error?.response?.data?.message;

      if ([400, 401, 404].includes(status) && backendMessage) {
        showErrorToast(backendMessage);
      } else {
        showErrorToast(backendMessage || "Something went wrong!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-xl">
        <h2 className="text-xl font-bold mb-2">Change Password</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Update your account password using your current password.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-900 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700 space-y-4"
        >
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200"
            >
              Current Password<span className="text-red-500">*</span>
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200"
            >
              New Password<span className="text-red-500">*</span>
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="confirmNewPassword"
              className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200"
            >
              Confirm New Password<span className="text-red-500">*</span>
            </label>
            <input
              id="confirmNewPassword"
              name="confirmNewPassword"
              type="password"
              value={formData.confirmNewPassword}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-cyan-600 text-white hover:bg-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
}

export default ChangePassword;
