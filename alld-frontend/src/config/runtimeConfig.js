const config = window.APP_CONFIG || {};

export const API_URL =
  typeof config.API_URL === "string" ? config.API_URL : "/api";

export const FILE_SERVER_URL =
  config.FILE_SERVER_URL || "";

export const RECAPTCHA_SITE_KEY =
  config.RECAPTCHA_SITE_KEY || "";

export default config;