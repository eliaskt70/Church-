import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { validationResult } from 'express-validator';
import db from '../config/database';
import { requireAuth } from '../middleware/auth';
import { createRatingValidator, serviceRatingsValidator } from '../utils/validators';

const router = Router();

// POST /api/ratings
router.post('/', requireAuth, createRatingValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: errors.array()[0].msg });
    return;
  }

  try {
    const { service_id, rating, comment } = req.body;
    const user_id = req.user!.userId;

    // Check service exists
    const service = await db('services').where('id', service_id).where('is_active', true).first();
    if (!service) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }

    // Check if user already rated this service
    const existingRating = await db('ratings')
      .where({ service_id, user_id })
      .first();

    if (existingRating) {
      res.status(409).json({ success: false, error: 'You have already rated this service' });
      return;
    }

    const [newRating] = await db('ratings')
      .insert({
        id: crypto.randomUUID(),
        service_id,
        user_id,
        rating,
        comment: comment || null,
      })
      .returning('*');

    res.status(201).json({ success: true, data: newRating });
  } catch (error) {
    console.error('Create rating error:', error);
    res.status(500).json({ success: false, error: 'Failed to create rating' });
  }
});

// GET /api/ratings/service/:serviceId
router.get('/service/:serviceId', serviceRatingsValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: errors.array()[0].msg });
    return;
  }

  try {
    const { serviceId } = req.params;

    const ratings = await db('ratings')
      .where('service_id', serviceId)
      .leftJoin('users', 'ratings.user_id', 'users.id')
      .select('ratings.*', 'users.name as user_name', 'users.avatar_url as user_avatar')
      .orderBy('ratings.created_at', 'desc');

    const avgResult = await db('ratings')
      .where('service_id', serviceId)
      .avg('rating as average')
      .count('* as total')
      .first();

    res.json({
      success: true,
      data: {
        ratings,
        average: avgResult ? parseFloat(avgResult.average as string) || 0 : 0,
        total: avgResult ? parseInt(avgResult.total as string) || 0 : 0,
      },
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ success: false, error: 'Failed to get ratings' });
  }
});

export default router;
