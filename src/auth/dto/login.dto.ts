import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiPropertyOptional({ example: 'admin@example.com', maxLength: 255 })
  @ValidateIf((o) => o.email !== undefined)
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    example: 'admin_user',
    description: '用户名或邮箱至少填一个',
    maxLength: 12,
  })
  @ValidateIf((o) => o.username !== undefined)
  @IsString()
  @MaxLength(12)
  @Matches(/^[\p{L}\p{N}_]+$/u, {
    message: '用户名仅允许中文、字母、数字或下划线',
  })
  username?: string;

  @ApiPropertyOptional({ example: 'admin123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
