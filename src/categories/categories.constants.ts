export const RESERVED_CATEGORY_SLUGS = ['all'] as const;

export const SYSTEM_CATEGORY_SLUGS = ['tech', 'music', 'visuals', 'other'] as const;

export const THEME_COLORS = [
  '#ff8800',
  '#e62e2e',
  '#00a3cc',
  '#aacc00',
  '#9900ff',
  '#ffaa00',
  '#00cc7a',
  '#3355ff',
  '#ff00aa',
  '#00aaaa',
  '#6600cc',
  '#cc3300',
  '#ff0055',
  '#00ccff',
  '#00e676',
  '#d500f9',
  '#ffd600',
  '#2962ff',
  '#6200ea',
  '#c51162',
  '#00c853',
] as const;

export type ThemeColor = (typeof THEME_COLORS)[number];

export const DEFAULT_CATEGORY_COLOR: ThemeColor = '#3355ff';

export type SystemCategorySlug = (typeof SYSTEM_CATEGORY_SLUGS)[number];

export const SYSTEM_CATEGORIES_SEED: Array<{
  slug: SystemCategorySlug;
  name: string;
  color: ThemeColor;
  sortOrder: number;
  isActive: boolean;
}> = [
  { slug: 'tech', name: '技术', color: '#ff8800', sortOrder: 10, isActive: true },
  { slug: 'music', name: '音乐', color: '#e62e2e', sortOrder: 20, isActive: true },
  { slug: 'visuals', name: '视觉', color: '#00a3cc', sortOrder: 30, isActive: true },
  { slug: 'other', name: '其他', color: '#00aaaa', sortOrder: 40, isActive: true },
];
