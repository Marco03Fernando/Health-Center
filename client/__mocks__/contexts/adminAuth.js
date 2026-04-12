const React = require('react');

module.exports = {
  useAdminAuth: () => ({
    admin: null,
    loading: false,
    isLoading: false,
    isAuthenticated: false,
    login: jest.fn(),
    logout: jest.fn(),
    updateProfile: jest.fn(),
  }),
  AdminAuthProvider: ({ children }) => children,
};
