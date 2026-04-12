const React = require('react');

module.exports = {
  useCenterAdmin: () => ({
    admin: null,
    isLoading: false,
    isAuthenticated: false,
    logout: jest.fn(),
    refreshAuth: jest.fn(),
  }),
  CenterAdminProvider: ({ children }) => children,
};
