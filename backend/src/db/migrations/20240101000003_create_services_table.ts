import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TYPE service_category AS ENUM (
      'home_maintenance',
      'educational',
      'handcrafts',
      'home_cooking',
      'delivery',
      'beauty',
      'tech_support',
      'other'
    );
  `);

  await knex.schema.createTable('services', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('provider_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('description');
    table.specificType('category', 'service_category').notNullable();
    table.specificType('location', 'geography(Point,4326)');
    table.decimal('radius_km', 6, 2);
    table.jsonb('photos').defaultTo('[]');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('services');
  await knex.raw('DROP TYPE IF EXISTS service_category');
}
