import { ApiProperty } from '@nestjs/swagger';

export class MetricsUptimeDto {
  @ApiProperty({
    example: 123456,
    description: 'Server uptime seconds since OS boot.',
  })
  uptimeSeconds: number;
}

