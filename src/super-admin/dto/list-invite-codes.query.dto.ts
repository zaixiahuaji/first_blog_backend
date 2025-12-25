import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class ListInviteCodesQueryDto {
  @ApiProperty({ enum: ['user', 'admin'] })
  @IsIn(['user', 'admin'])
  role: 'user' | 'admin';
}
