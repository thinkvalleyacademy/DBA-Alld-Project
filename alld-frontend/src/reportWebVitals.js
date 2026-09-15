import { reportWebVital } from "./utility/telemetry";

const reportWebVitals = onPerfEntry => {
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    const handleMetric = (metric) => {
      if (onPerfEntry && onPerfEntry instanceof Function) {
        onPerfEntry(metric);
      }
      reportWebVital(metric);
    };

    getCLS(handleMetric);
    getFID(handleMetric);
    getFCP(handleMetric);
    getLCP(handleMetric);
    getTTFB(handleMetric);
    });
};

export default reportWebVitals;
