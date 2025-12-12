import { Client } from 'pg';

type EnsurePgVectorOptions = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

export async function ensurePgVectorExtension(
  opts: EnsurePgVectorOptions,
): Promise<void> {
  const client = new Client({
    host: opts.host,
    port: opts.port,
    user: opts.user,
    password: opts.password,
    database: opts.database,
  });

  await client.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
  } finally {
    await client.end();
  }
}
