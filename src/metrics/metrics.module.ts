import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { SiteCounter } from './site-counter.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SiteCounter])],
  controllers: [MetricsController],
  providers: [MetricsService],
})
export class MetricsModule {}
