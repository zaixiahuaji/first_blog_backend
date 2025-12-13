export const CREATE_POSTS_EMBEDDING_HNSW_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS posts_embedding_hnsw_idx
  ON posts
  USING hnsw (embedding vector_l2_ops)
  WHERE embedding IS NOT NULL
`;

