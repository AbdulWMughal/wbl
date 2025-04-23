// Polyfill for TextEncoder and TextDecoder
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Mock Firebase services (if necessary for tests)
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  // You can add more methods as needed
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytesResumable: jest.fn().mockResolvedValue({ ref: 'mock_ref' }),
  getDownloadURL: jest.fn().mockResolvedValue('mock_url'),
  deleteObject: jest.fn(),
}));
