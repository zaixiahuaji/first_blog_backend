import { ApiProperty } from '@nestjs/swagger';
import { IsAlphanumeric, IsIn, IsNotEmpty, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateManagedUserDto {
  @ApiProperty({
    example: 'new_user',
    description: '用户名唯一，中文/英文/数字/下划线',
    maxLength: 12,
  })
  @IsNotEmpty()
  @MaxLength(12)
  @Matches(/^[\p{L}\p{N}_]+$/u, {
    message: '用户名仅允许中文、字母、数字或下划线',
  })
  username: string;

  @ApiProperty({
    example: 'abc123',
    description: '仅字母和数字，长度 1-10',
    maxLength: 10,
  })
  @IsNotEmpty()
  @IsAlphanumeric()
  @MinLength(1)
  @MaxLength(10)
  password: string;

  @ApiProperty({ enum: ['user', 'admin'] })
  @IsIn(['user', 'admin'])
  role: 'user' | 'admin';
}
