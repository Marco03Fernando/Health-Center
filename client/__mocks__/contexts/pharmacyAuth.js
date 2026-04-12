const React = require('react');

module.exports = {
  usePharmacyAuth: () => ({
    pharmacist: null,
    isLoading: false,
    isAuthenticated: false,
    logout: jest.fn(),
    refreshAuth: jest.fn(),
    updateProfile: jest.fn(),
  }),
  PharmacyAuthProvider: ({ children }) => children,
};
