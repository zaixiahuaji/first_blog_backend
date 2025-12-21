import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post as HttpPost,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { PostsService } from './posts.service';
import { ListPostsQueryDto } from './dto/list-posts.query.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import {
  PostsCategoriesStatsDto,
  PostsTotalDto,
} from './dto/posts-stats.dto';
import { PaginatedPostsDto } from './dto/paginated-posts.dto';
import { PostDto } from './dto/post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({
    summary: '获取文章列表（支持分页/排序/过滤/关键词 q/语义 vectorQ）',
  })
  @ApiOkResponse({ description: '分页列表', type: PaginatedPostsDto })
  findAll(@Query() query: ListPostsQueryDto): Promise<PaginatedPostsDto> {
    return this.postsService.findAll(query) as any;
  }

  @Get('stats/total')
  @ApiOperation({ summary: '获取文章总数' })
  @ApiOkResponse({ description: '文章总数', type: PostsTotalDto })
  getTotal(): Promise<PostsTotalDto> {
    return this.postsService.getTotal();
  }

  @Get('stats/categories')
  @ApiOperation({ summary: '获取各类别文章数量' })
  @ApiOkResponse({
    description: '各类别文章数量（包含禁用类别，包含 0）',
    type: PostsCategoriesStatsDto,
  })
  getCategoriesStats(): Promise<PostsCategoriesStatsDto> {
    return this.postsService.getCategoriesStats();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取文章详情' })
  @ApiParam({ name: 'id', description: '文章 UUID' })
  @ApiOkResponse({ description: '文章详情', type: PostDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<PostDto> {
    return this.postsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost()
  @ApiBearerAuth('BearerAuth')
  @ApiUnauthorizedResponse({ description: '未登录或 token 无效' })
  @ApiOperation({ summary: '创建文章（需要登录）' })
  @ApiCreatedResponse({ description: '创建成功', type: PostDto })
  create(
    @Req() req: Request,
    @Body() dto: CreatePostDto,
  ): Promise<PostDto> {
    return this.postsService.create(dto, req.user as any);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth('BearerAuth')
  @ApiUnauthorizedResponse({ description: '未登录或 token 无效' })
  @ApiOperation({ summary: '更新文章（需要登录）' })
  @ApiParam({ name: 'id', description: '文章 UUID' })
  @ApiOkResponse({ description: '更新成功', type: PostDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
    @Body() dto: UpdatePostDto,
  ): Promise<PostDto> {
    return this.postsService.update(id, dto, req.user as any);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth('BearerAuth')
  @ApiUnauthorizedResponse({ description: '未登录或 token 无效' })
  @ApiOperation({ summary: '删除文章（需要登录）' })
  @ApiParam({ name: 'id', description: '文章 UUID' })
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ): Promise<void> {
    await this.postsService.remove(id, req.user as any);
  }
}
