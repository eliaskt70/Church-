import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('services').insert([
    {
      id: 'd4e5f6a7-b8c9-0123-defa-234567890123',
      provider_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      title: 'Home Plumbing Repair',
      description: 'Professional plumbing services for all home repairs including leaks, pipe installation, and maintenance.',
      category: 'home_maintenance',
      location: knex.raw("ST_SetSRID(ST_MakePoint(46.6753, 24.7136), 4326)::geography"),
      radius_km: 15.0,
      photos: JSON.stringify([]),
      is_active: true,
    },
    {
      id: 'e5f6a7b8-c9d0-1234-efab-345678901234',
      provider_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      title: 'Electrical Maintenance',
      description: 'Certified electrician providing home electrical repairs, installations, and safety inspections.',
      category: 'home_maintenance',
      location: knex.raw("ST_SetSRID(ST_MakePoint(46.6753, 24.7136), 4326)::geography"),
      radius_km: 20.0,
      photos: JSON.stringify([]),
      is_active: true,
    },
    {
      id: 'f6a7b8c9-d0e1-2345-fabc-456789012345',
      provider_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      title: 'Private Math Tutoring',
      description: 'Experienced math teacher offering private lessons for high school and university students.',
      category: 'educational',
      location: knex.raw("ST_SetSRID(ST_MakePoint(46.6884, 24.7255), 4326)::geography"),
      radius_km: 10.0,
      photos: JSON.stringify([]),
      is_active: true,
    },
    {
      id: 'a7b8c9d0-e1f2-3456-abcd-567890123456',
      provider_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      title: 'Traditional Saudi Cooking',
      description: 'Homemade traditional Saudi dishes prepared fresh and delivered to your door.',
      category: 'home_cooking',
      location: knex.raw("ST_SetSRID(ST_MakePoint(46.6884, 24.7255), 4326)::geography"),
      radius_km: 8.0,
      photos: JSON.stringify([]),
      is_active: true,
    },
  ]);
}
