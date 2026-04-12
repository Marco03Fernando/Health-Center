module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleFileExtensions: ['js','jsx','ts','tsx','json'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  moduleNameMapper: {
    // Third-party ESM-only packages that can't be transformed
    '^jspdf$': '<rootDir>/__mocks__/jspdf.js',
    '^jspdf-autotable$': '<rootDir>/__mocks__/jspdfAutotable.js',
    // Specific module mocks MUST come before the catch-all @/ pattern
    '^@/config/api$': '<rootDir>/src/config/__mocks__/apiMock.js',
    '^@radix-ui/react-toast$': '<rootDir>/src/__mocks__/@radix-ui-react-toast.js',
    // Context mocks — return predictable safe defaults so components render without providers
    '^@/contexts/AdminAuthContext$': '<rootDir>/__mocks__/contexts/adminAuth.js',
    '^@/contexts/UserAppContext$': '<rootDir>/__mocks__/contexts/userApp.js',
    '^@/contexts/CenterAdminContext$': '<rootDir>/__mocks__/contexts/centerAdmin.js',
    '^@/contexts/LabTechContext$': '<rootDir>/__mocks__/contexts/labTech.js',
    '^@/contexts/PharmacyAuthContext$': '<rootDir>/__mocks__/contexts/pharmacyAuth.js',
    // Asset mocks
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    // Catch-all for @/ path alias — must be LAST
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testPathIgnorePatterns: ['/node_modules/','/dist/'],
  collectCoverage: false
};
