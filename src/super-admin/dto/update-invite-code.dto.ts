import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateInviteCodeDto {
  @ApiProperty()
  @IsBoolean()
  enabled: boolean;
}
