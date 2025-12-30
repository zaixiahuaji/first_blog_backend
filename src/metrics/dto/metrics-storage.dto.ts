import { ApiProperty } from '@nestjs/swagger';

export class MetricsStorageDto {
  @ApiProperty({ example: '/', description: 'Measured filesystem path.' })
  path: string;

  @ApiProperty({ example: 64.5, description: 'Used percent of the path.' })
  usedPercent: number;
}
