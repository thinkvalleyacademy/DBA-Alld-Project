const TELEMETRY_ENABLED = process.env.REACT_APP_TELEMETRY_ENABLED === "true";
const TELEMETRY_ENDPOINT = process.env.REACT_APP_TELEMETRY_ENDPOINT;

const canSendTelemetry = () =>
  TELEMETRY_ENABLED &&
  typeof TELEMETRY_ENDPOINT === "string" &&
  TELEMETRY_ENDPOINT.trim().length > 0;

const postTelemetry = (eventType, payload) => {
  if (!canSendTelemetry()) return;

  const body = JSON.stringify({
    eventType,
    timestamp: new Date().toISOString(),
    app: "dba-frontend",
    environment: process.env.NODE_ENV,
    path: window.location.pathname,
    userAgent: navigator.userAgent,
    payload,
  });

  if (navigator.sendBeacon && document.visibilityState === "hidden") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(TELEMETRY_ENDPOINT, blob);
    return;
  }

  fetch(TELEMETRY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
};

export const reportWebVital = (metric) => {
  postTelemetry("web_vital", {
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    entries: metric.entries?.length || 0,
  });
};

export const reportReactError = (error, errorInfo) => {
  postTelemetry("react_error", {
    message: error?.message || "Unknown error",
    stack: error?.stack || null,
    componentStack: errorInfo?.componentStack || null,
  });
};

export const initGlobalErrorHandlers = () => {
  if (!canSendTelemetry()) return;

  window.addEventListener("error", (event) => {
    postTelemetry("window_error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    postTelemetry("unhandled_rejection", {
      reason:
        typeof event.reason === "string"
          ? event.reason
          : event.reason?.message || "Unhandled promise rejection",
    });
  });
};

