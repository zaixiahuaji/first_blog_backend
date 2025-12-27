import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import {
  ALLOWED_IMAGE_MIME,
  IMAGES_SUBDIR,
  MAX_IMAGE_BYTES,
  UPLOADS_DIR_NAME,
} from './media.constants';

type UploadResult = {
  url: string;
  key: string;
};

@Injectable()
export class MediaService {
  private readonly uploadsRoot = join(process.cwd(), UPLOADS_DIR_NAME);

  async saveImage(file: Express.Multer.File): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('请上传图片文件');
    }

    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      throw new BadRequestException('图片格式不支持');
    }

    if (file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException('图片大小不能超过 5MB');
    }

    if (!this.isValidImageMagic(file)) {
      throw new BadRequestException('图片文件已损坏或格式不正确');
    }

    const ext = this.extFromMime(file.mimetype);
    const key = this.buildKey(ext);
    const absolutePath = join(this.uploadsRoot, key);

    await fs.mkdir(dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, file.buffer);

    return {
      url: `/uploads/${key}`,
      key,
    };
  }

  private buildKey(ext: string): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = `${now.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${now.getUTCDate()}`.padStart(2, '0');
    const name = randomUUID();

    return `${IMAGES_SUBDIR}/${year}/${month}/${day}/${name}.${ext}`;
  }

  private extFromMime(mime: string): string {
    switch (mime) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/gif':
        return 'gif';
      default:
        return 'bin';
    }
  }

  private isValidImageMagic(file: Express.Multer.File): boolean {
    const buffer = file.buffer;
    if (!buffer || buffer.length < 12) return false;

    switch (file.mimetype) {
      case 'image/jpeg':
        return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      case 'image/png':
        return this.matchBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      case 'image/gif':
        return (
          this.matchString(buffer, 'GIF87a') ||
          this.matchString(buffer, 'GIF89a')
        );
      case 'image/webp':
        return (
          this.matchString(buffer, 'RIFF') && this.matchString(buffer, 'WEBP', 8)
        );
      default:
        return false;
    }
  }

  private matchBytes(buffer: Buffer, bytes: number[], offset = 0): boolean {
    if (buffer.length < bytes.length + offset) return false;
    return bytes.every((value, index) => buffer[index + offset] === value);
  }

  private matchString(buffer: Buffer, text: string, offset = 0): boolean {
    if (buffer.length < text.length + offset) return false;
    return buffer.toString('ascii', offset, offset + text.length) === text;
  }
}
