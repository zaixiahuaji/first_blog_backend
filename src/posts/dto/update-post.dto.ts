import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiPropertyOptional({ example: '模拟复兴（修订版）', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ enum: ['tech', 'music', 'visuals'] })
  @IsOptional()
  @IsString()
  @IsIn(['tech', 'music', 'visuals'])
  category?: 'tech' | 'music' | 'visuals';

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
