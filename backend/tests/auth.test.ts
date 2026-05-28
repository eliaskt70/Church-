import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock the database module
jest.mock('../src/config/database', () => {
  const mockDb: any = jest.fn(() => mockDb);
  mockDb.where = jest.fn().mockReturnThis();
  mockDb.first = jest.fn();
  mockDb.insert = jest.fn().mockReturnThis();
  mockDb.returning = jest.fn();
  mockDb.select = jest.fn().mockReturnThis();
  mockDb.raw = jest.fn();
  mockDb.fn = { now: jest.fn(() => new Date().toISOString()) };
  return { __esModule: true, default: mockDb };
});

import app from '../src/server';
import { otpStore } from '../src/routes/auth';
import db from '../src/config/database';

const mockDb = db as any;

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    otpStore.clear();
  });

  describe('POST /api/auth/request-otp', () => {
    it('should return 200 and log OTP for valid phone', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const res = await request(app)
        .post('/api/auth/request-otp')
        .send({ phone: '+1234567890' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('OTP sent successfully');

      // Verify OTP was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[OTP] Phone: +1234567890')
      );

      consoleSpy.mockRestore();
    });

    it('should return 400 for invalid phone', async () => {
      const res = await request(app)
        .post('/api/auth/request-otp')
        .send({ phone: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should store OTP in memory', async () => {
      jest.spyOn(console, 'log').mockImplementation();

      await request(app)
        .post('/api/auth/request-otp')
        .send({ phone: '+1234567890' });

      expect(otpStore.has('+1234567890')).toBe(true);
      const stored = otpStore.get('+1234567890');
      expect(stored).toHaveProperty('hash');
      expect(stored).toHaveProperty('expiresAt');
      expect(stored!.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    it('should return JWT for valid OTP', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // First request OTP
      await request(app)
        .post('/api/auth/request-otp')
        .send({ phone: '+1234567890' });

      // Extract OTP from console log
      const logCall = consoleSpy.mock.calls.find((call) =>
        call[0].includes('[OTP]')
      );
      const otpMatch = logCall![0].match(/Code: (\d{6})/);
      const otp = otpMatch![1];

      // Mock DB: user not found, then insert
      mockDb.mockImplementation(() => mockDb);
      mockDb.where.mockReturnThis();
      mockDb.first.mockResolvedValue(null);
      mockDb.insert.mockReturnThis();
      mockDb.returning.mockResolvedValue([
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          phone: '+1234567890',
          account_type: 'beneficiary',
        },
      ]);

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: '+1234567890', code: otp });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.phone).toBe('+1234567890');

      // Verify token is valid
      const decoded = jwt.verify(res.body.data.token, 'test-secret-key') as any;
      expect(decoded.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(decoded.accountType).toBe('beneficiary');

      consoleSpy.mockRestore();
    });

    it('should return 400 for invalid OTP', async () => {
      jest.spyOn(console, 'log').mockImplementation();

      await request(app)
        .post('/api/auth/request-otp')
        .send({ phone: '+1234567890' });

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: '+1234567890', code: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid OTP code');
    });

    it('should return 400 for expired OTP', async () => {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('123456', 10);

      // Set expired OTP
      otpStore.set('+1234567890', {
        hash,
        expiresAt: new Date(Date.now() - 1000), // expired
      });

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: '+1234567890', code: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('OTP has expired');
    });

    it('should return 400 when no OTP was requested', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: '+9999999999', code: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('No OTP requested for this phone');
    });

    it('should return existing user if phone exists', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await request(app)
        .post('/api/auth/request-otp')
        .send({ phone: '+1234567890' });

      const logCall = consoleSpy.mock.calls.find((call) =>
        call[0].includes('[OTP]')
      );
      const otpMatch = logCall![0].match(/Code: (\d{6})/);
      const otp = otpMatch![1];

      // Mock DB: existing user found
      mockDb.mockImplementation(() => mockDb);
      mockDb.where.mockReturnThis();
      mockDb.first.mockResolvedValue({
        id: 'existing-user-id',
        phone: '+1234567890',
        account_type: 'provider',
      });

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: '+1234567890', code: otp });

      expect(res.status).toBe(200);
      expect(res.body.data.user.id).toBe('existing-user-id');
      expect(res.body.data.user.account_type).toBe('provider');

      consoleSpy.mockRestore();
    });
  });

  describe('Protected endpoints require authentication', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Authentication required');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid or expired token');
    });
  });
});
