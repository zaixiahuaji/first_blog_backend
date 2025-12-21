import { ApiProperty } from '@nestjs/swagger';
import { PostDto } from './post.dto';

export class PaginatedPostsDto {
  @ApiProperty({ type: [PostDto], description: '文章列表' })
  items: PostDto[];

  @ApiProperty({ example: 123, description: '总数' })
  total: number;

  @ApiProperty({ example: 1, description: '页码（从 1 开始）' })
  page: number;

  @ApiProperty({ example: 20, description: '每页条数' })
  limit: number;
}

