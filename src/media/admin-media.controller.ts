import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { MAX_IMAGE_BYTES } from './media.constants';
import { MediaService } from './media.service';

@ApiTags('admin.media')
@ApiBearerAuth('BearerAuth')
@ApiUnauthorizedResponse({ description: '未登录或 token 无效' })
@Roles('admin', 'super_admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/media')
export class AdminMediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('images')
  @ApiOperation({ summary: '管理端：上传图片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        alt: { type: 'string' },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({
    description: '上传成功',
    schema: {
      example: {
        url: '/uploads/images/2025/12/27/xxxx.webp',
        key: 'images/2025/12/27/xxxx.webp',
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMAGE_BYTES },
    }),
  )
  async uploadImage(
    @UploadedFile() file?: Express.Multer.File,
    @Body('alt') _alt?: string,
  ) {
    if (!file) {
      throw new BadRequestException('请上传图片文件');
    }
    return this.mediaService.saveImage(file);
  }
}
