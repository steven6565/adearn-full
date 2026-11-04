import pg from 'pg';

// Supabase Postgres needs SSL. The pooler URL from Supabase works with this.
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  max: 5,
});

export const db = {
  query: (text, params) => pool.query(text, params),
  // Run a function inside one transaction. If it throws, everything rolls back.
  async tx(fn) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};
