import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock the database module
jest.mock('../src/config/database', () => {
  const mockDb: any = jest.fn(() => mockDb);
  mockDb.where = jest.fn().mockReturnThis();
  mockDb.orWhere = jest.fn().mockReturnThis();
  mockDb.groupBy = jest.fn().mockReturnThis();
  mockDb.orderBy = jest.fn().mockReturnThis();
  mockDb.limit = jest.fn().mockReturnThis();
  mockDb.offset = jest.fn().mockReturnThis();
  mockDb.first = jest.fn();
  mockDb.insert = jest.fn(() => ({ returning: jest.fn() }));
  mockDb.returning = jest.fn();
  mockDb.select = jest.fn().mockReturnThis();
  mockDb.raw = jest.fn((sql: string) => sql);
  mockDb.fn = { now: jest.fn(() => new Date().toISOString()) };
  return { __esModule: true, default: mockDb };
});

import app from '../src/server';
import db from '../src/config/database';

const mockDb = db as any;

function generateToken(userId: string, accountType: string): string {
  return jwt.sign({ userId, accountType }, 'test-secret-key', { expiresIn: '7d' });
}

describe('Messages Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.mockImplementation(() => mockDb);
    mockDb.where.mockReturnThis();
    mockDb.orWhere.mockReturnThis();
    mockDb.groupBy.mockReturnThis();
    mockDb.orderBy.mockReturnThis();
    mockDb.limit.mockReturnThis();
    mockDb.offset.mockReturnThis();
    mockDb.select.mockReturnThis();
  });

  describe('POST /api/messages', () => {
    it('should send a message and create conversation', async () => {
      const token = generateToken('sender-id', 'beneficiary');
      const messageData = {
        receiver_id: '550e8400-e29b-41d4-a716-446655440001',
        content: 'Hello, I need your service',
      };

      // Mock receiver exists
      mockDb.where.mockReturnThis();
      mockDb.first
        .mockResolvedValueOnce({ id: '550e8400-e29b-41d4-a716-446655440001', name: 'Provider' }) // receiver check
        .mockResolvedValueOnce(null); // no existing conversation

      const createdMessage = {
        id: 'message-uuid',
        sender_id: 'sender-id',
        receiver_id: '550e8400-e29b-41d4-a716-446655440001',
        conversation_id: 'new-conv-id',
        content: 'Hello, I need your service',
        created_at: new Date().toISOString(),
      };

      mockDb.insert.mockReturnValue({
        returning: jest.fn().mockResolvedValue([createdMessage]),
      });

      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token}`)
        .send(messageData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('Hello, I need your service');
      expect(res.body.data.sender_id).toBe('sender-id');
    });

    it('should reject sending message to self', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440001';
      const token = generateToken(userId, 'beneficiary');

      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          receiver_id: userId,
          content: 'Hello myself',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Cannot send message to yourself');
    });

    it('should reject message to non-existent user', async () => {
      const token = generateToken('sender-id', 'beneficiary');

      mockDb.where.mockReturnThis();
      mockDb.first.mockResolvedValue(null); // receiver not found

      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          receiver_id: '550e8400-e29b-41d4-a716-446655440099',
          content: 'Hello',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Receiver not found');
    });

    it('should require authentication', async () => {
      const res = await request(app).post('/api/messages').send({
        receiver_id: '550e8400-e29b-41d4-a716-446655440001',
        content: 'Hello',
      });

      expect(res.status).toBe(401);
    });

    it('should validate message content', async () => {
      const token = generateToken('sender-id', 'beneficiary');

      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          receiver_id: '550e8400-e29b-41d4-a716-446655440001',
          content: '', // empty content
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/messages/conversations', () => {
    it('should list user conversations', async () => {
      const token = generateToken('user-id', 'beneficiary');

      const conversations = [
        { conversation_id: 'conv-1' },
        { conversation_id: 'conv-2' },
      ];

      mockDb.where.mockReturnThis();
      mockDb.orWhere.mockReturnThis();
      mockDb.groupBy.mockReturnThis();
      mockDb.orderBy.mockResolvedValueOnce(conversations);

      // Mock for each conversation's last message and other user
      mockDb.first
        .mockResolvedValueOnce({
          id: 'msg-1',
          sender_id: 'other-user-1',
          receiver_id: 'user-id',
          conversation_id: 'conv-1',
          content: 'Last message 1',
          created_at: '2024-01-01',
        })
        .mockResolvedValueOnce({ id: 'other-user-1', name: 'User 1', avatar_url: null })
        .mockResolvedValueOnce({
          id: 'msg-2',
          sender_id: 'user-id',
          receiver_id: 'other-user-2',
          conversation_id: 'conv-2',
          content: 'Last message 2',
          created_at: '2024-01-02',
        })
        .mockResolvedValueOnce({ id: 'other-user-2', name: 'User 2', avatar_url: null });

      const res = await request(app)
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].conversation_id).toBe('conv-1');
      expect(res.body.data[0].last_message).toBeDefined();
      expect(res.body.data[0].other_user).toBeDefined();
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/messages/conversations');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/messages/:conversationId', () => {
    it('should return paginated messages for conversation', async () => {
      const token = generateToken('user-id', 'beneficiary');

      const messages = [
        { id: 'msg-1', content: 'Hello', sender_id: 'user-id', created_at: '2024-01-01' },
        { id: 'msg-2', content: 'Hi there', sender_id: 'other-id', created_at: '2024-01-01' },
      ];

      mockDb.where.mockReturnThis();
      mockDb.orWhere.mockReturnThis();
      mockDb.orderBy.mockReturnThis();
      mockDb.limit.mockReturnThis();
      mockDb.offset.mockResolvedValue(messages);

      const res = await request(app)
        .get('/api/messages/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: '1', limit: '20' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.messages).toHaveLength(2);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(20);
    });
  });
});
