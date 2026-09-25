import config from "../config/runtimeConfig";

const stripTrailingSlashes = (value = "") => value.replace(/\/+$/, "");

/**
 * Returns the base URL for the file server (no trailing slash).
 *
 * Priority:
 * 1) FILE_SERVER_URL from runtime config
 * 2) Derive from API_URL from runtime config
 */
export const getFileServerBaseUrl = () => {
  const explicit = (config.FILE_SERVER_URL || "").trim();

  if (explicit) {
    const normalized = stripTrailingSlashes(explicit);
    return normalized || "/files";
  }

  const apiUrlRaw = (config.API_URL || "").trim();

  if (!apiUrlRaw || apiUrlRaw === "/" || apiUrlRaw === "/api") {
    return "/files";
  }

  const apiUrl = stripTrailingSlashes(apiUrlRaw);

  if (apiUrl.endsWith("/api")) {
    const prefix = apiUrl.slice(0, -4);
    return `${prefix || ""}/files`;
  }

  return `${apiUrl}/files`;
};