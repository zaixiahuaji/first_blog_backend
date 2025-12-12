import {
  Column,
  type ColumnOptions,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

const DEFAULT_EMBEDDING_DIMS = 1536;
const VECTOR_COLUMN_TYPE = 'vector' as unknown as NonNullable<
  ColumnOptions['type']
>;

function parseVector(value: unknown): number[] | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value.map((v) => Number(v));
  if (typeof value !== 'string') return null;
  const s = value.trim();
  if (!s.startsWith('[') || !s.endsWith(']')) return null;
  const inner = s.slice(1, -1).trim();
  if (!inner) return [];
  return inner.split(',').map((x) => Number(x.trim()));
}

@Entity({ name: 'posts' })
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 50 })
  category: string;

  // 字符串日期，方便前端直接展示
  @Column({ type: 'varchar', length: 32 })
  date: string;

  @Column({ type: 'text' })
  excerpt: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    // pgvector 扩展的列类型，TypeORM 类型系统里没有 vector，所以需要 as any
    type: VECTOR_COLUMN_TYPE,
    nullable: true,
    length: DEFAULT_EMBEDDING_DIMS,
    transformer: {
      to: (value?: number[] | null) =>
        value == null ? null : `[${value.join(',')}]`,
      from: (value: unknown) => parseVector(value),
    },
  })
  embedding: number[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
