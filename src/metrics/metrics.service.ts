import { InternalServerErrorException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parse } from 'node:path';
import { freemem, totalmem } from 'node:os';
import { MetricsPageviewsDto } from './dto/metrics-pageviews.dto';
import { MetricsStorageDto } from './dto/metrics-storage.dto';
import { MetricsMemoryDto } from './dto/metrics-memory.dto';

const execFileAsync = promisify(execFile);

@Injectable()
export class MetricsService {
  private readonly pageviewsKey = 'pageviews_total';

  constructor(private readonly dataSource: DataSource) {}

  async incrementPageviews(): Promise<MetricsPageviewsDto> {
    const rows = await this.dataSource.query(
      'INSERT INTO site_counters ("key", "value") VALUES ($1, 1) ' +
        'ON CONFLICT ("key") DO UPDATE SET "value" = site_counters."value" + 1 ' +
        'RETURNING "value";',
      [this.pageviewsKey],
    );

    const rawValue = rows?.[0]?.value ?? 0;
    const total = Number.parseInt(String(rawValue), 10);
    return { total: Number.isFinite(total) ? total : 0 };
  }

  async getStorageUsage(): Promise<MetricsStorageDto> {
    const targetPath = this.resolveDiskUsagePath();
    const usedPercent =
      process.platform === 'win32'
        ? await this.getWindowsUsagePercent(targetPath)
        : await this.getUnixUsagePercent(targetPath);

    return {
      path: targetPath,
      usedPercent,
    };
  }

  getMemoryUsage(): MetricsMemoryDto {
    const totalBytesRaw = totalmem();
    const freeBytesRaw = freemem();

    const totalBytes =
      Number.isFinite(totalBytesRaw) && totalBytesRaw > 0 ? totalBytesRaw : 0;
    const freeBytes =
      Number.isFinite(freeBytesRaw) && freeBytesRaw > 0 ? freeBytesRaw : 0;

    const usedBytes = Math.max(0, totalBytes - freeBytes);
    const usedPercentRaw =
      totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;
    const usedPercent = Number.isFinite(usedPercentRaw)
      ? Number(usedPercentRaw.toFixed(1))
      : 0;

    return {
      totalBytes,
      freeBytes,
      usedBytes,
      usedPercent,
    };
  }

  private resolveDiskUsagePath(): string {
    const configured = (process.env.DISK_USAGE_PATH ?? '').trim();
    if (configured) return configured;
    if (process.platform === 'win32') return parse(process.cwd()).root;
    return '/';
  }

  private async getUnixUsagePercent(targetPath: string): Promise<number> {
    try {
      const { stdout } = await execFileAsync('df', ['-P', targetPath]);
      const lines = stdout.trim().split(/\r?\n/);
      if (lines.length < 2) {
        throw new Error('df output missing expected data');
      }
      const columns = lines[1].trim().split(/\s+/);
      const usedPercentRaw = columns[4] ?? '';
      const usedPercent = Number.parseFloat(usedPercentRaw.replace('%', ''));
      if (!Number.isFinite(usedPercent)) {
        throw new Error(`invalid percent: ${usedPercentRaw}`);
      }
      return Number(usedPercent.toFixed(1));
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to read disk usage: ${error?.message ?? 'unknown error'}`,
      );
    }
  }

  private async getWindowsUsagePercent(targetPath: string): Promise<number> {
    const root = targetPath.trim();
    const deviceId = root.replace(/\\+$/, '');

    try {
      const { stdout } = await execFileAsync('wmic', [
        'logicaldisk',
        'where',
        `DeviceID='${deviceId}'`,
        'get',
        'FreeSpace,Size',
        '/value',
      ]);
      const freeMatch = stdout.match(/FreeSpace=(\d+)/i);
      const sizeMatch = stdout.match(/Size=(\d+)/i);
      if (!freeMatch || !sizeMatch) {
        throw new Error('wmic output missing FreeSpace/Size');
      }
      const free = Number.parseInt(freeMatch[1], 10);
      const size = Number.parseInt(sizeMatch[1], 10);
      if (!Number.isFinite(size) || size <= 0) {
        throw new Error('invalid disk size');
      }
      const usedPercent = ((size - free) / size) * 100;
      return Number(usedPercent.toFixed(1));
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to read disk usage: ${error?.message ?? 'unknown error'}`,
      );
    }
  }
}
