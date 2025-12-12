import { Client } from 'pg';

type EnsureDatabaseOptions = {
  host: string;
  port: number;
  user: string;
  password: string;
  databaseName: string;
};

/**
 * Postgres 没有 `CREATE DATABASE IF NOT EXISTS`，所以需要先查 `pg_database` 再决定是否创建。
 * 注意：需要所用账号具备创建数据库权限（一般用 postgres 超级用户即可）。
 */
export async function ensureDatabaseExists(
  opts: EnsureDatabaseOptions,
): Promise<void> {
  const adminClient = new Client({
    host: opts.host,
    port: opts.port,
    user: opts.user,
    password: opts.password,
    // 连接到默认库，避免目标库不存在导致无法连接
    database: 'postgres',
  });

  await adminClient.connect();
  try {
    const check = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [opts.databaseName],
    );
    if (check.rowCount && check.rowCount > 0) return;

    // 数据库名作为标识符，需要双引号转义；这里仅允许字母数字下划线，避免注入/非法名称
    if (!/^[a-zA-Z0-9_]+$/.test(opts.databaseName)) {
      throw new Error(
        `Invalid DB_NAME: "${opts.databaseName}". Only [a-zA-Z0-9_] is allowed.`,
      );
    }

    await adminClient.query(`CREATE DATABASE "${opts.databaseName}"`);
  } finally {
    await adminClient.end();
  }
}
