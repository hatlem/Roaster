// Integration tests for Authentication API

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import app from '../../src/index';

const prisma = new PrismaClient();

describe('Auth API', () => {
  beforeAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test@',
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123',
          firstName: 'Test',
          lastName: 'User',
          employeeNumber: 'TEST001',
        });

      expect(response.status).toBe(201);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.role).toBe('EMPLOYEE');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com', // Same email as above
          password: 'SecurePass123',
          firstName: 'Test',
          lastName: 'User2',
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already registered');
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecurePass123',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
    });

    it('should reject short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test2@example.com',
          password: '12345', // Too short
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Create a test user
      const passwordHash = await bcrypt.hash('TestPassword123', 10);
      await prisma.user.upsert({
        where: { email: 'login-test@example.com' },
        update: {},
        create: {
          email: 'login-test@example.com',
          passwordHash,
          firstName: 'Login',
          lastName: 'Test',
          role: 'EMPLOYEE',
        },
      });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'TestPassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('login-test@example.com');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should reject incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123',
        });

      expect(response.status).toBe(401);
    });

    it('should return valid JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'TestPassword123',
        });

      expect(response.status).toBe(200);
      const token = response.body.token;
      expect(token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/); // JWT format
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;

    beforeAll(async () => {
      // Login to get token
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'TestPassword123',
        });

      authToken = response.body.token;
    });

    it('should return user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('login-test@example.com');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});
