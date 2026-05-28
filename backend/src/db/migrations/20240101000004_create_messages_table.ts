import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('sender_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('receiver_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('conversation_id').notNullable();
    table.text('content').notNullable();
    table.timestamp('read_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.table('messages', (table) => {
    table.index('conversation_id');
    table.index('sender_id');
    table.index('receiver_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('messages');
}
