import { ApiProperty } from '@nestjs/swagger';

export class MetricsPageviewsDto {
  @ApiProperty({ example: 8402, description: 'Total page views.' })
  total: number;
}
