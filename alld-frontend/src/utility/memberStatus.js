export const normalizeMemberStatus = (status) =>
  typeof status === "string" && status.trim()
    ? status.trim().toUpperCase()
    : "UNKNOWN";

export const getMemberStatusMeta = (status) => {
  const normalizedStatus = normalizeMemberStatus(status);

  if (normalizedStatus === "ACTIVE") {
    return {
      status: normalizedStatus,
      label: "ACTIVE",
      pillClassName: "bg-green-100 text-green-800",
      softPillClassName:
        "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
      iconButtonTitle: "ACTIVE",
      iconButtonBackgroundColor: "green",
      iconButtonHoverColor: "#16A34A",
    };
  }

  if (normalizedStatus === "INACTIVE") {
    return {
      status: normalizedStatus,
      label: "INACTIVE",
      pillClassName: "bg-yellow-100 text-yellow-800",
      softPillClassName:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
      iconButtonTitle: "INACTIVE",
      iconButtonBackgroundColor: "#CA8A04",
      iconButtonHoverColor: "#A16207",
    };
  }

  if (normalizedStatus === "DELETED") {
    return {
      status: normalizedStatus,
      label: "DELETED",
      pillClassName: "bg-red-100 text-red-800",
      softPillClassName:
        "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
      iconButtonTitle: "DELETED",
      iconButtonBackgroundColor: "#DC2626",
      iconButtonHoverColor: "#B91C1C",
    };
  }

  return {
    status: normalizedStatus,
    label: normalizedStatus,
    pillClassName: "bg-gray-100 text-gray-800",
    softPillClassName:
      "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
    iconButtonTitle: normalizedStatus,
    iconButtonBackgroundColor: "#6B7280",
    iconButtonHoverColor: "#4B5563",
  };
};
