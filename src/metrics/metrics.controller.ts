import { Controller, Get, Header, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { MetricsPageviewsDto } from './dto/metrics-pageviews.dto';
import { MetricsStorageDto } from './dto/metrics-storage.dto';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Post('pageviews')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Increment homepage page views.' })
  @ApiOkResponse({ description: 'Total page views', type: MetricsPageviewsDto })
  incrementPageviews(): Promise<MetricsPageviewsDto> {
    return this.metricsService.incrementPageviews();
  }

  @Get('storage')
  @ApiOperation({ summary: 'Get root partition usage.' })
  @ApiOkResponse({ description: 'Root partition usage', type: MetricsStorageDto })
  getStorageUsage(): Promise<MetricsStorageDto> {
    return this.metricsService.getStorageUsage();
  }
}
