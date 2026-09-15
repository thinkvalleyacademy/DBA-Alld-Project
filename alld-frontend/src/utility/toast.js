import { toast } from "react-toastify";
import { FaCheckCircle, FaTimesCircle, FaInfoCircle } from "react-icons/fa"; // Optional: Font Awesome icons

// Centralized toast messages into constants for better reusability.
const successMessage = "Operation successful!";
const errorMessage = "Something went wrong!";
const infoMessage = "Heads up!";

// ✅ Success Toast
export const showSuccessToast = (message = successMessage) => {
  toast.success(
    <div>
      <FaCheckCircle style={{ marginRight: "8px", color: "#28a745" }} />
      {message}
    </div>,
    {
      position: "top-right",
      icon: "✅", // optional if using emoji
    }
  );
};

// ❌ Error Toast
export const showErrorToast = (message = errorMessage) => {
  toast.error(
    <div>
      <FaTimesCircle style={{ marginRight: "8px", color: "#dc3545" }} />
      {message}
    </div>,
    {
      position: "bottom-left",
      icon: "❌",
    }
  );
};

// ℹ️ Info Toast
export const showInfoToast = (message = infoMessage) => {
  toast.info(
    <div>
      <FaInfoCircle style={{ marginRight: "8px", color: "#17a2b8" }} />
      {message}
    </div>,
    {
      position: "top-center",
      icon: "ℹ️",
    }
  );
};
