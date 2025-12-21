import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListPostsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    enum: ['createdAt', 'date', 'title'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'date', 'title'])
  sort?: 'createdAt' | 'date' | 'title';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC';

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

  @ApiPropertyOptional({ description: '关键词搜索（ILIKE）' })
  @IsOptional()
  @IsString()
  q?: string;

  /**
   * 语义搜索文本：传了就走 pgvector 向量检索（优先级高于 q）。
   */
  @ApiPropertyOptional({
    description: '语义搜索文本（pgvector + OpenAI embeddings）',
  })
  @IsOptional()
  @IsString()
  vectorQ?: string;
}
