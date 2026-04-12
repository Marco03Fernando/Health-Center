// Minimal API mock for tests — avoids import.meta usage
exports.API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8081';

exports.buildApiUrl = function (endpoint) {
  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${exports.API_BASE_URL}${normalized}`;
};
