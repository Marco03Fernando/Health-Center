const React = require('react');

module.exports = {
  useLabTech: () => ({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    logout: jest.fn(),
    refreshAuth: jest.fn(),
  }),
  LabTechProvider: ({ children }) => children,
};
