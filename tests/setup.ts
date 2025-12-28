// Test setup file
// Runs before all tests

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Global test setup
beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

// Clean up after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Mock environment variables for tests
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/roster_test';
