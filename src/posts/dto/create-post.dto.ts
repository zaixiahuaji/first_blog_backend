import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ example: '模拟复兴', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ enum: ['tech', 'music', 'visuals'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['tech', 'music', 'visuals'])
  category: 'tech' | 'music' | 'visuals';

  @ApiProperty({ example: '2023-11-05', maxLength: 32 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  date: string;

  @ApiProperty({ example: '摘要...', description: '列表页短摘要' })
  @IsString()
  @IsNotEmpty()
  excerpt: string;

  @ApiProperty({ example: '正文...', description: '文章正文内容' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
