import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { THEME_COLORS } from '../categories.constants';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'ai_notes',
    description: '唯一标识（仅字母/数字/下划线，<=12，强制小写）',
    maxLength: 12,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  @Matches(/^[a-z0-9_]{1,12}$/, {
    message: 'slug must match ^[a-z0-9_]{1,12}$',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  slug: string;

  @ApiProperty({ example: 'AI 笔记', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ example: '与 AI 相关的记录' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '#3355ff',
    description: '必须从主题色中选择',
    enum: THEME_COLORS,
  })
  @IsString()
  @IsIn(THEME_COLORS)
  color: string;

  @ApiPropertyOptional({
    example: 40,
    description: '排序权重（越小越靠前）',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: true, description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

