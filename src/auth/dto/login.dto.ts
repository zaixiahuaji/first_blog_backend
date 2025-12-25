import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'admin_user',
    description: '用户名',
    maxLength: 12,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  @Matches(/^[\p{L}\p{N}_]+$/u, {
    message: '用户名仅允许中文、字母、数字或下划线',
  })
  username: string;

  @ApiProperty({ example: 'admin123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
