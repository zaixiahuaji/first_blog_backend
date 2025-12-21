import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiPropertyOptional({ example: '模拟复兴（修订版）', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    example: 'tech',
    description: '类别 slug（仅字母/数字/下划线，<=12，强制小写）',
    maxLength: 12,
  })
  @IsOptional()
  @IsString()
  @MaxLength(12)
  @Matches(/^[a-z0-9_]{1,12}$/, {
    message: 'category must match ^[a-z0-9_]{1,12}$',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  category?: string;

  @ApiPropertyOptional({ example: '2023-11-06', maxLength: 32 })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  date?: string;

  @ApiPropertyOptional({ example: '摘要（更新）...' })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional({ example: '正文（更新）...' })
  @IsOptional()
  @IsString()
  content?: string;
}
