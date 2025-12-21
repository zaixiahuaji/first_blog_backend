import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: '模拟复兴', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    example: 'tech',
    description: '类别 slug（仅字母/数字/下划线，<=12，强制小写）',
    maxLength: 12,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  @Matches(/^[a-z0-9_]{1,12}$/, {
    message: 'category must match ^[a-z0-9_]{1,12}$',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  category: string;

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
