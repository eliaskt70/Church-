import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TYPE account_type AS ENUM ('beneficiary', 'provider');
  `);

  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('phone').unique();
    table.string('name');
    table.string('email').unique();
    table.string('google_id').unique();
    table.specificType('account_type', 'account_type').notNullable().defaultTo('beneficiary');
    table.specificType('location', 'geography(Point,4326)');
    table.string('avatar_url');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
  await knex.raw('DROP TYPE IF EXISTS account_type');
}
