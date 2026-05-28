import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { validationResult } from 'express-validator';
import db from '../config/database';
import { requireAuth } from '../middleware/auth';
import {
  createServiceValidator,
  updateServiceValidator,
  geoSearchValidator,
  serviceIdValidator,
} from '../utils/validators';
import { findServicesInRadius } from '../services/geo';

const router = Router();

// POST /api/services
router.post('/', requireAuth, createServiceValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: errors.array()[0].msg });
    return;
  }

  try {
    if (req.user!.accountType !== 'provider') {
      res.status(403).json({ success: false, error: 'Only providers can create services' });
      return;
    }

    const { title, description, category, lat, lng, radius_km, photos } = req.body;

    const serviceData: Record<string, unknown> = {
      id: crypto.randomUUID(),
      provider_id: req.user!.userId,
      title,
      description: description || null,
      category,
      radius_km: radius_km || null,
      photos: JSON.stringify(photos || []),
      is_active: true,
    };

    if (lat !== undefined && lng !== undefined) {
      serviceData.location = db.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography`, [lng, lat]);
    }

    const [service] = await db('services').insert(serviceData).returning('*');

    res.status(201).json({ success: true, data: service });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ success: false, error: 'Failed to create service' });
  }
});

// GET /api/services
router.get('/', geoSearchValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: errors.array()[0].msg });
    return;
  }

  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusKm = parseFloat(req.query.radius_km as string) || 2;
    const category = req.query.category as string | undefined;

    const services = await findServicesInRadius(
      lat,
      lng,
      radiusKm,
      category as any
    );

    res.json({ success: true, data: services });
  } catch (error) {
    console.error('Search services error:', error);
    res.status(500).json({ success: false, error: 'Failed to search services' });
  }
});

// GET /api/services/:id
router.get('/:id', serviceIdValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: errors.array()[0].msg });
    return;
  }

  try {
    const service = await db('services')
      .where('services.id', req.params.id)
      .where('services.is_active', true)
      .leftJoin('users', 'services.provider_id', 'users.id')
      .select(
        'services.*',
        'users.name as provider_name',
        'users.avatar_url as provider_avatar',
        'users.phone as provider_phone'
      )
      .first();

    if (!service) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }

    res.json({ success: true, data: service });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ success: false, error: 'Failed to get service' });
  }
});

// PUT /api/services/:id
router.put('/:id', requireAuth, serviceIdValidator, updateServiceValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: errors.array()[0].msg });
    return;
  }

  try {
    const service = await db('services').where('id', req.params.id).first();

    if (!service) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }

    if (service.provider_id !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'You can only update your own services' });
      return;
    }

    const { title, description, category, lat, lng, radius_km, photos } = req.body;
    const updates: Record<string, unknown> = { updated_at: db.fn.now() };

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (radius_km !== undefined) updates.radius_km = radius_km;
    if (photos !== undefined) updates.photos = JSON.stringify(photos);
    if (lat !== undefined && lng !== undefined) {
      updates.location = db.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography`, [lng, lat]);
    }

    const [updated] = await db('services')
      .where('id', req.params.id)
      .update(updates)
      .returning('*');

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ success: false, error: 'Failed to update service' });
  }
});

// DELETE /api/services/:id (soft delete)
router.delete('/:id', requireAuth, serviceIdValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: errors.array()[0].msg });
    return;
  }

  try {
    const service = await db('services').where('id', req.params.id).first();

    if (!service) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }

    if (service.provider_id !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'You can only delete your own services' });
      return;
    }

    await db('services')
      .where('id', req.params.id)
      .update({ is_active: false, updated_at: db.fn.now() });

    res.json({ success: true, data: { message: 'Service deleted successfully' } });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete service' });
  }
});

export default router;
