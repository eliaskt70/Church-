import { Router, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import db from '../config/database';
import { requireAuth } from '../middleware/auth';
import { updateProfileValidator, updateLocationValidator } from '../utils/validators';
import { updateUserLocation } from '../services/geo';

const router = Router();

// GET /api/users/me
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await db('users').where('id', req.user!.userId).first();

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
});

// PUT /api/users/me
router.put('/me', requireAuth, updateProfileValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: errors.array()[0].msg });
    return;
  }

  try {
    const { name, avatar_url, account_type } = req.body;
    const updates: Record<string, unknown> = { updated_at: db.fn.now() };

    if (name !== undefined) updates.name = name;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (account_type !== undefined) updates.account_type = account_type;

    const [user] = await db('users')
      .where('id', req.user!.userId)
      .update(updates)
      .returning('*');

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// PUT /api/users/me/location
router.put('/me/location', requireAuth, updateLocationValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: errors.array()[0].msg });
    return;
  }

  try {
    const { lat, lng } = req.body;

    await updateUserLocation(req.user!.userId, lat, lng);

    const user = await db('users').where('id', req.user!.userId).first();

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ success: false, error: 'Failed to update location' });
  }
});

export default router;
