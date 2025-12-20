import { ApiProperty } from '@nestjs/swagger';

export class PostsTotalDto {
  @ApiProperty({ example: 123, description: '文章总数' })
  total: number;
}

export class PostsCategoryCountDto {
  @ApiProperty({ example: 'tech', description: '分类名称' })
  category: string;

  @ApiProperty({ example: 42, description: '该分类文章数量' })
  count: number;
}

export class PostsCategoriesStatsDto {
  @ApiProperty({
    type: [PostsCategoryCountDto],
    description: '各分类文章数量',
  })
  categories: PostsCategoryCountDto[];
}

