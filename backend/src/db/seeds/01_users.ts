import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('ratings').del();
  await knex('messages').del();
  await knex('services').del();
  await knex('users').del();

  await knex('users').insert([
    {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      phone: '+966501234567',
      name: 'Ahmed Al-Salem',
      email: 'ahmed@example.com',
      account_type: 'provider',
      location: knex.raw("ST_SetSRID(ST_MakePoint(46.6753, 24.7136), 4326)::geography"),
    },
    {
      id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      phone: '+966509876543',
      name: 'Fatima Hassan',
      email: 'fatima@example.com',
      account_type: 'provider',
      location: knex.raw("ST_SetSRID(ST_MakePoint(46.6884, 24.7255), 4326)::geography"),
    },
    {
      id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
      phone: '+966505551234',
      name: 'Omar Khalid',
      email: 'omar@example.com',
      account_type: 'beneficiary',
      location: knex.raw("ST_SetSRID(ST_MakePoint(46.7100, 24.6900), 4326)::geography"),
    },
  ]);
}
