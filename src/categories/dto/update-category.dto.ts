import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmpty, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { THEME_COLORS } from '../categories.constants';

export class UpdateCategoryDto {
  @ApiHideProperty()
  @IsEmpty({ message: 'slug is immutable' })
  slug?: string;

  @ApiPropertyOptional({ example: 'AI 笔记', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ example: '与 AI 相关的记录' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    example: '#3355ff',
    description: '必须从主题色中选择',
    enum: THEME_COLORS,
  })
  @IsOptional()
  @IsString()
  @IsIn(THEME_COLORS)
  color?: string;

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

