import { ApiProperty } from '@nestjs/swagger';

export class PostDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'admin', maxLength: 12 })
  username: string;

  @ApiProperty({ example: '模拟复兴', maxLength: 255 })
  title: string;

  @ApiProperty({
    example: 'tech',
    description: '类别 slug',
    maxLength: 12,
  })
  category: string;

  @ApiProperty({ example: '2023-11-05', maxLength: 32 })
  date: string;

  @ApiProperty({ example: '摘要...' })
  excerpt: string;

  @ApiProperty({ example: '正文...' })
  content: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

