import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, Matches } from 'class-validator';
import { INVITE_CODE_REGEX } from '../../auth/invite-code.utils';

export class CreateInviteCodeDto {
  @ApiProperty({ enum: ['user', 'admin'] })
  @IsIn(['user', 'admin'])
  role: 'user' | 'admin';

  @ApiPropertyOptional({
    example: 'ABCD-1234',
    description: '可选，手动指定邀请码（必须大写且包含 -）',
  })
  @IsOptional()
  @Matches(INVITE_CODE_REGEX, {
    message: '邀请码格式必须为 XXXX-XXXX（大写字母/数字）',
  })
  code?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
