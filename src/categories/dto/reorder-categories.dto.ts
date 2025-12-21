import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ReorderCategoriesDto {
  @ApiProperty({
    description: '按目标顺序提交的 Category id 列表（后端按顺序重算 sortOrder）',
    example: ['uuid-tech', 'uuid-music', 'uuid-visuals'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  orderedIds: string[];
}

