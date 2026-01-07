import { Controller, Get, Header, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { MetricsPageviewsDto } from './dto/metrics-pageviews.dto';
import { MetricsStorageDto } from './dto/metrics-storage.dto';
import { MetricsMemoryDto } from './dto/metrics-memory.dto';
import { MetricsUptimeDto } from './dto/metrics-uptime.dto';

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

  @Get('memory')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Get memory usage.' })
  @ApiOkResponse({ description: 'Memory usage', type: MetricsMemoryDto })
  getMemoryUsage(): MetricsMemoryDto {
    return this.metricsService.getMemoryUsage();
  }

  @Get('uptime')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Get server uptime.' })
  @ApiOkResponse({ description: 'Server uptime', type: MetricsUptimeDto })
  getUptime(): MetricsUptimeDto {
    return this.metricsService.getUptime();
  }
}
