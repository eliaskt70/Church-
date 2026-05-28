import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { validationResult } from 'express-validator';
import db from '../config/database';
import { requireAuth } from '../middleware/auth';
import {
  sendMessageValidator,
  conversationIdValidator,
  paginationValidator,
} from '../utils/validators';

const router = Router();

// GET /api/messages/conversations
router.get('/conversations', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const conversations = await db('messages')
      .select('conversation_id')
      .where('sender_id', userId)
      .orWhere('receiver_id', userId)
      .groupBy('conversation_id')
      .orderBy(db.raw('MAX(created_at)'), 'desc');

    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await db('messages')
          .where('conversation_id', conv.conversation_id)
          .orderBy('created_at', 'desc')
          .first();

        const otherUserId =
          lastMessage!.sender_id === userId
            ? lastMessage!.receiver_id
            : lastMessage!.sender_id;

        const otherUser = await db('users')
          .where('id', otherUserId)
          .select('id', 'name', 'avatar_url')
          .first();

        return {
          conversation_id: conv.conversation_id,
          last_message: lastMessage,
          other_user: otherUser,
        };
      })
    );

    res.json({ success: true, data: conversationsWithLastMessage });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, error: 'Failed to get conversations' });
  }
});

// GET /api/messages/:conversationId
router.get(
  '/:conversationId',
  requireAuth,
  conversationIdValidator,
  paginationValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: errors.array()[0].msg });
      return;
    }

    try {
      const { conversationId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const messages = await db('messages')
        .where('conversation_id', conversationId)
        .where(function () {
          this.where('sender_id', req.user!.userId).orWhere('receiver_id', req.user!.userId);
        })
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      res.json({ success: true, data: { messages, page, limit } });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ success: false, error: 'Failed to get messages' });
    }
  }
);

// POST /api/messages
router.post('/', requireAuth, sendMessageValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: errors.array()[0].msg });
    return;
  }

  try {
    const { receiver_id, content } = req.body;
    const sender_id = req.user!.userId;

    if (sender_id === receiver_id) {
      res.status(400).json({ success: false, error: 'Cannot send message to yourself' });
      return;
    }

    // Check receiver exists
    const receiver = await db('users').where('id', receiver_id).first();
    if (!receiver) {
      res.status(404).json({ success: false, error: 'Receiver not found' });
      return;
    }

    // Find existing conversation or create new one
    const existingMessage = await db('messages')
      .where(function () {
        this.where({ sender_id, receiver_id }).orWhere({
          sender_id: receiver_id,
          receiver_id: sender_id,
        });
      })
      .first();

    const conversation_id = existingMessage
      ? existingMessage.conversation_id
      : crypto.randomUUID();

    const [message] = await db('messages')
      .insert({
        id: crypto.randomUUID(),
        sender_id,
        receiver_id,
        conversation_id,
        content,
      })
      .returning('*');

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

export default router;
