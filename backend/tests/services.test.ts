import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock the database module
jest.mock('../src/config/database', () => {
  const mockDb: any = jest.fn(() => mockDb);
  mockDb.where = jest.fn().mockReturnThis();
  mockDb.whereRaw = jest.fn().mockReturnThis();
  mockDb.first = jest.fn();
  mockDb.insert = jest.fn(() => ({ returning: jest.fn() }));
  mockDb.returning = jest.fn();
  mockDb.select = jest.fn().mockReturnThis();
  mockDb.leftJoin = jest.fn().mockReturnThis();
  mockDb.orderBy = jest.fn().mockResolvedValue([]);
  mockDb.update = jest.fn(() => ({ returning: jest.fn() }));
  mockDb.raw = jest.fn((sql: string, bindings?: any[]) => ({ sql, bindings }));
  mockDb.fn = { now: jest.fn(() => new Date().toISOString()) };
  return { __esModule: true, default: mockDb };
});

import app from '../src/server';
import db from '../src/config/database';

const mockDb = db as any;

function generateToken(userId: string, accountType: string): string {
  return jwt.sign({ userId, accountType }, 'test-secret-key', { expiresIn: '7d' });
}

describe('Services Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock chain
    mockDb.mockImplementation(() => mockDb);
    mockDb.where.mockReturnThis();
    mockDb.whereRaw.mockReturnThis();
    mockDb.select.mockReturnThis();
    mockDb.leftJoin.mockReturnThis();
    mockDb.orderBy.mockResolvedValue([]);
  });

  describe('POST /api/services', () => {
    it('should create a service for a provider', async () => {
      const token = generateToken('provider-user-id', 'provider');
      const serviceData = {
        title: 'Plumbing Service',
        description: 'Professional plumbing',
        category: 'home_maintenance',
        lat: 33.8938,
        lng: 35.5018,
        radius_km: 5,
      };

      const createdService = {
        id: 'service-uuid',
        provider_id: 'provider-user-id',
        ...serviceData,
        is_active: true,
      };

      mockDb.insert.mockReturnValue({
        returning: jest.fn().mockResolvedValue([createdService]),
      });

      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${token}`)
        .send(serviceData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Plumbing Service');
    });

    it('should reject service creation for non-providers', async () => {
      const token = generateToken('beneficiary-user-id', 'beneficiary');

      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Some Service',
          category: 'other',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Only providers can create services');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/services')
        .send({ title: 'Test', category: 'other' });

      expect(res.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const token = generateToken('provider-user-id', 'provider');

      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${token}`)
        .send({}); // Missing title and category

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/services', () => {
    it('should return services within radius using PostGIS', async () => {
      const services = [
        {
          id: 'svc-1',
          title: 'Nearby Service',
          category: 'home_maintenance',
          distance: 500,
        },
        {
          id: 'svc-2',
          title: 'Another Nearby',
          category: 'educational',
          distance: 1500,
        },
      ];

      // Mock the geo service query chain
      mockDb.select.mockReturnThis();
      mockDb.whereRaw.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.orderBy.mockResolvedValue(services);

      const res = await request(app)
        .get('/api/services')
        .query({ lat: '33.8938', lng: '35.5018', radius_km: '2' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(services);
    });

    it('should filter by category', async () => {
      mockDb.select.mockReturnThis();
      mockDb.whereRaw.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.orderBy.mockResolvedValue([
        { id: 'svc-1', title: 'Cooking Service', category: 'home_cooking', distance: 300 },
      ]);

      const res = await request(app)
        .get('/api/services')
        .query({ lat: '33.8938', lng: '35.5018', category: 'home_cooking' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should require lat and lng query params', async () => {
      const res = await request(app).get('/api/services');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should default radius to 2km', async () => {
      mockDb.select.mockReturnThis();
      mockDb.whereRaw.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.orderBy.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/services')
        .query({ lat: '33.8938', lng: '35.5018' });

      expect(res.status).toBe(200);
      // Verify ST_DWithin was called with 2000 meters (2km default)
      expect(mockDb.whereRaw).toHaveBeenCalledWith(
        expect.stringContaining('ST_DWithin'),
        expect.arrayContaining([35.5018, 33.8938, 2000])
      );
    });
  });

  describe('GET /api/services/:id', () => {
    it('should return service with provider info', async () => {
      const service = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Service',
        provider_name: 'John',
        provider_avatar: null,
        is_active: true,
      };

      mockDb.where.mockReturnThis();
      mockDb.leftJoin.mockReturnThis();
      mockDb.select.mockReturnThis();
      mockDb.first.mockResolvedValue(service);

      const res = await request(app).get(
        '/api/services/550e8400-e29b-41d4-a716-446655440000'
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Service');
      expect(res.body.data.provider_name).toBe('John');
    });

    it('should return 404 for non-existent service', async () => {
      mockDb.where.mockReturnThis();
      mockDb.leftJoin.mockReturnThis();
      mockDb.select.mockReturnThis();
      mockDb.first.mockResolvedValue(null);

      const res = await request(app).get(
        '/api/services/550e8400-e29b-41d4-a716-446655440000'
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid UUID', async () => {
      const res = await request(app).get('/api/services/not-a-uuid');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/services/:id', () => {
    it('should soft delete own service', async () => {
      const token = generateToken('provider-user-id', 'provider');

      mockDb.where.mockReturnThis();
      mockDb.first.mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440000',
        provider_id: 'provider-user-id',
      });
      mockDb.update.mockResolvedValue(1);

      const res = await request(app)
        .delete('/api/services/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should not delete another provider service', async () => {
      const token = generateToken('other-user-id', 'provider');

      mockDb.where.mockReturnThis();
      mockDb.first.mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440000',
        provider_id: 'provider-user-id', // different user
      });

      const res = await request(app)
        .delete('/api/services/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
