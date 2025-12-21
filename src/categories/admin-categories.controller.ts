import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Category } from './category.entity';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('admin.categories')
@ApiBearerAuth('BearerAuth')
@ApiUnauthorizedResponse({ description: '未登录或 token 无效' })
@Roles('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: '管理端：获取全部类别（含禁用）' })
  @ApiOkResponse({ description: '类别列表' })
  adminFindAll(): Promise<Category[]> {
    return this.categoriesService.adminFindAll();
  }

  @Post()
  @ApiOperation({ summary: '管理端：创建类别（slug 不可修改）' })
  create(@Body() dto: CreateCategoryDto): Promise<Category> {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '管理端：更新类别（不允许改 slug）' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.update(id, dto);
  }

  @Put('order')
  @ApiOperation({ summary: '管理端：批量更新类别排序（orderedIds）' })
  async reorder(@Body() dto: ReorderCategoriesDto): Promise<void> {
    await this.categoriesService.reorder(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '管理端：删除类别（文章迁移到 other）' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.categoriesService.remove(id);
  }
}

