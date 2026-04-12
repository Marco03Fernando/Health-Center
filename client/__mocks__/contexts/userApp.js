const React = require('react');

module.exports = {
  useUserApp: () => ({
    user: null,
    cart: [],
    orders: [],
    isAuthLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    addToCart: jest.fn(),
    removeFromCart: jest.fn(),
    clearCart: jest.fn(),
    placeOrder: jest.fn(),
  }),
  UserAppProvider: ({ children }) => children,
};
