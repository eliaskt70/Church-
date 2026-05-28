import db from '../config/database';
import { ServiceCategory } from '../types';

export async function findServicesInRadius(
  lat: number,
  lng: number,
  radiusKm: number,
  category?: ServiceCategory
) {
  const radiusMeters = radiusKm * 1000;

  let query = db('services')
    .select(
      'services.*',
      db.raw(
        `ST_Distance(services.location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) as distance`,
        [lng, lat]
      )
    )
    .whereRaw(
      `ST_DWithin(services.location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)`,
      [lng, lat, radiusMeters]
    )
    .where('services.is_active', true);

  if (category) {
    query = query.where('services.category', category);
  }

  return query.orderBy('distance', 'asc');
}

export async function updateUserLocation(userId: string, lat: number, lng: number) {
  return db('users')
    .where('id', userId)
    .update({
      location: db.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography`, [lng, lat]),
      updated_at: db.fn.now(),
    });
}

export function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): ReturnType<typeof db.raw> {
  return db.raw(
    `ST_Distance(
      ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
      ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography
    )`,
    [point1.lng, point1.lat, point2.lng, point2.lat]
  );
}
