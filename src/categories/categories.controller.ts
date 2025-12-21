import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { Category } from './category.entity';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: '获取启用的类别列表（按 sortOrder 排序）' })
  @ApiOkResponse({ description: '类别列表' })
  findActive(): Promise<
    Array<Pick<Category, 'id' | 'slug' | 'name' | 'color' | 'sortOrder'>>
  > {
    return this.categoriesService.findActive();
  }
}

