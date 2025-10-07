// Jest setup file
// This file runs before each test suite

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.DB_NAME = 'web_ide_test';

// Increase timeout for integration tests
jest.setTimeout(10000);

// Global test cleanup
afterAll(async () => {
  // Give time for async operations to complete
  await new Promise(resolve => setTimeout(resolve, 500));
});
