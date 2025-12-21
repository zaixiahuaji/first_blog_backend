import { ApiProperty } from '@nestjs/swagger';

export class PostsTotalDto {
  @ApiProperty({ example: 123, description: '文章总数' })
  total: number;
}

export class PostsCategoryStatsItemDto {
  @ApiProperty({ example: 'uuid', description: '类别 UUID' })
  id: string;

  @ApiProperty({ example: 'tech', description: '类别 slug' })
  slug: string;

  @ApiProperty({ example: '技术', description: '类别显示名' })
  name: string;

  @ApiProperty({ example: '#ff8800', description: '主题色' })
  color: string;

  @ApiProperty({ example: 10, description: '排序权重（越小越靠前）' })
  sortOrder: number;

  @ApiProperty({ example: true, description: '是否启用' })
  isActive: boolean;

  @ApiProperty({ example: true, description: '是否系统内置' })
  isSystem: boolean;

  @ApiProperty({ example: 42, description: '该类别文章数量（含 0）' })
  count: number;
}

export class PostsCategoriesStatsDto {
  @ApiProperty({
    type: [PostsCategoryStatsItemDto],
    description: '各类别文章数量（包含禁用类别，包含 0）',
  })
  categories: PostsCategoryStatsItemDto[];
}
