import { neon } from '@neondatabase/serverless';

/**
 * Neon PostgreSQL Client Helper
 * Menggunakan @neondatabase/serverless untuk query over HTTP / WebSocket.
 * Cocok untuk lingkungan Serverless / Next.js Server Components & Server Actions.
 */

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV !== 'production') {
  console.warn(
    '⚠️ [Neon DB] DATABASE_URL belum dikonfigurasi di file .env.local. Pastikan Anda telah menambahkan string koneksi dari Neon Dashboard.'
  );
}

export const sql = neon(connectionString || '');
