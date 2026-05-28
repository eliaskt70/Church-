import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'qarib',
    user: process.env.DB_USER || 'qarib_user',
    password: process.env.DB_PASSWORD || 'qarib_password',
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: '../db/migrations',
  },
  seeds: {
    directory: '../db/seeds',
  },
});

export default db;
