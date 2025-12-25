import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateManagedUserRoleDto {
  @ApiProperty({ enum: ['user', 'admin'] })
  @IsIn(['user', 'admin'])
  role: 'user' | 'admin';
}
