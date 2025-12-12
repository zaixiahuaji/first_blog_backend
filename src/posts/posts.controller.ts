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
import { PostsService } from './posts.service';
import { Post } from './post.entity';
import { ListPostsQueryDto } from './dto/list-posts.query.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({
    summary: '获取文章列表（支持分页/排序/过滤/关键词 q/语义 vectorQ）',
  })
  @ApiOkResponse({ description: '分页列表' })
  findAll(@Query() query: ListPostsQueryDto) {
    return this.postsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取文章详情' })
  @ApiParam({ name: 'id', description: '文章 UUID' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<Post> {
    return this.postsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost()
  @ApiBearerAuth('BearerAuth')
  @ApiUnauthorizedResponse({ description: '未登录或 token 无效' })
  @ApiOperation({ summary: '创建文章（需要登录）' })
  create(@Body() dto: CreatePostDto): Promise<Post> {
    return this.postsService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth('BearerAuth')
  @ApiUnauthorizedResponse({ description: '未登录或 token 无效' })
  @ApiOperation({ summary: '更新文章（需要登录）' })
  @ApiParam({ name: 'id', description: '文章 UUID' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePostDto,
  ): Promise<Post> {
    return this.postsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth('BearerAuth')
  @ApiUnauthorizedResponse({ description: '未登录或 token 无效' })
  @ApiOperation({ summary: '删除文章（需要登录）' })
  @ApiParam({ name: 'id', description: '文章 UUID' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.postsService.remove(id);
  }
}
