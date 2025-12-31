import { ApiProperty } from '@nestjs/swagger';

export class MetricsMemoryDto {
  @ApiProperty({ example: 8589934592, description: 'Total memory bytes.' })
  totalBytes: number;

  @ApiProperty({ example: 2147483648, description: 'Free memory bytes.' })
  freeBytes: number;

  @ApiProperty({ example: 6442450944, description: 'Used memory bytes.' })
  usedBytes: number;

  @ApiProperty({ example: 75.0, description: 'Used memory percent.' })
  usedPercent: number;
}

