import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, IsNull, Repository } from 'typeorm';
import { Post } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ListPostsQueryDto } from './dto/list-posts.query.dto';
import { NotFoundException } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service';

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

type SortField = NonNullable<ListPostsQueryDto['sort']>;

const DEFAULT_POSTS: DeepPartial<Post>[] = [
  {
    title: '模拟复兴',
    category: 'tech',
    date: '2023-11-05',
    excerpt: '为何我们在触摸屏的世界中回归触觉界面。按键的咔哒声很重要。',
    content:
      '在触摸屏主导的今天，物理反馈的缺失让人感到空虚。机械键盘的敲击声、老式收音机的旋钮阻尼，这些触觉体验不仅仅是怀旧，更是人机交互中不可或缺的确认感。模拟复兴不是倒退，而是重新找回被数字洪流冲刷掉的质感。',
  },
  {
    title: '霓虹夜与城市之光',
    category: 'visuals',
    date: '2023-10-31',
    excerpt: '探索80年代末动画的赛博黑色美学及其对现代网页设计的影响。',
    content:
      '赛博朋克美学不仅仅是霓虹灯和雨夜。它探讨的是高科技与低生活的反差。80年代末的动画作品通过高对比度的色彩、复杂的机械细节和阴郁的氛围，构建了一个既迷人又危险的未来。这种视觉语言正在现代网页设计中复苏，提醒我们关注技术的阴暗面。',
  },
  {
    title: '合成器基础',
    category: 'music',
    date: '2023-10-15',
    excerpt: '了解FM合成与减法合成的区别。让我们制造一些噪音。',
    content:
      '合成器不仅仅是制造声音的机器，它们是塑造情绪的工具。FM合成带来金属质感的冰冷音色，而减法合成则提供温暖厚实的基底。掌握波形、包络和滤波器的关系，你就能从无到有地构建出属于未来的声音图景。',
  },
  {
    title: '磁带维护 101',
    category: 'tech',
    date: '2023-09-22',
    excerpt: '如何仅用一支铅笔和耐心修复缠绕的磁带。不要丢失你的记忆。',
    content:
      '磁带是脆弱的记忆载体，但也是有温度的。当磁带缠绕时，不要慌张。准备一支六棱铅笔，轻轻插入卷轴孔，顺时针缓慢旋转。这不仅是修复物理介质，更是一场与过去时光的微型手术。保持耐心，记忆终将归位。',
  },
  {
    title: '虚空中的矢量',
    category: 'visuals',
    date: '2023-09-10',
    excerpt: '线框图形之美。当更少的几何形状意味着更多的想象力。',
    content:
      '早期计算机图形学的限制造就了独特的矢量美学。在算力匮乏的年代，仅用简单的线条和几何形状构建三维空间，需要极大的创造力。这种极简主义在今天依然具有震撼力，它告诉我们：限制往往是创新的催化剂。',
  },
  {
    title: '暗潮播放列表',
    category: 'music',
    date: '2023-08-30',
    excerpt: '深夜黑客会话的精选曲目。为明亮头脑准备的阴郁节拍。',
    content:
      '当城市沉睡，代码在屏幕上跳动，你需要一份特殊的背景音。这里精选了最具沉浸感的暗潮（Darkwave）与合成波曲目。低沉的贝斯线、若隐若现的人声采样，加上稳定的鼓点，助你潜入数字世界的深层。',
  },
];

@Injectable()
export class PostsService {
  private embeddingsBackfilled = false;

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  private normalizeQuery(q?: string): string {
    return (q ?? '').trim();
  }

  private async ensureSeeded(): Promise<void> {
    const count = await this.postRepository.count();
    if (count > 0) return;

    const seeded = this.postRepository.create(DEFAULT_POSTS);
    await this.postRepository.save(seeded);
  }

  private buildEmbeddingText(
    post: Pick<Post, 'title' | 'excerpt' | 'content'>,
  ): string {
    return `${post.title}\n\n${post.excerpt}\n\n${post.content}`;
  }

  private toVectorLiteral(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }

  private async backfillEmbeddingsOnce(): Promise<void> {
    if (this.embeddingsBackfilled) return;

    // 没配置 OPENAI_API_KEY 就先跳过，避免影响基础 CRUD/关键词搜索
    if (!this.embeddingsService.apiKey) return;

    const missing = await this.postRepository.find({
      where: { embedding: IsNull() },
      order: { createdAt: 'ASC' },
    });

    for (const post of missing) {
      const text = this.buildEmbeddingText(post);
      const embedding = await this.embeddingsService.embedText(text);
      post.embedding = embedding;
      await this.postRepository.save(post);
    }

    this.embeddingsBackfilled = true;
  }

  async findAll(queryDto: ListPostsQueryDto): Promise<PaginatedResult<Post>> {
    await this.ensureSeeded();
    await this.backfillEmbeddingsOnce();

    const page = queryDto.page ?? 1;
    const limit = queryDto.limit ?? 20;
    const sort = queryDto.sort ?? 'createdAt';
    const order = queryDto.order ?? 'DESC';
    const q = this.normalizeQuery(queryDto.q);
    const vectorQ = this.normalizeQuery(queryDto.vectorQ);
    const category = queryDto.category;

    const qb = this.postRepository.createQueryBuilder('post');

    if (category) {
      qb.andWhere('post.category = :category', { category });
    }

    // vectorQ 优先：有语义搜索就走 pgvector；否则走原有 ILIKE 关键词搜索
    if (vectorQ) {
      if (!this.embeddingsService.apiKey) {
        throw new Error(
          'Vector search requested but OPENAI_API_KEY is missing.',
        );
      }

      qb.andWhere('post.embedding IS NOT NULL');

      const queryEmbedding = await this.embeddingsService.embedText(vectorQ);
      qb.setParameter('qEmbedding', this.toVectorLiteral(queryEmbedding));
      qb.orderBy('post.embedding <-> :qEmbedding::vector', 'ASC');
      qb.skip((page - 1) * limit).take(limit);

      const [items, total] = await qb.getManyAndCount();
      return { items, total, page, limit };
    }

    if (q) {
      qb.andWhere(
        '(post.title ILIKE :q OR post.excerpt ILIKE :q OR post.content ILIKE :q)',
        { q: `%${q}%` },
      );
    }

    const sortColumnMap: Record<SortField, string> = {
      createdAt: 'post.createdAt',
      date: 'post.date',
      title: 'post.title',
    };

    qb.orderBy(sortColumnMap[sort], order);
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<Post> {
    await this.ensureSeeded();
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async create(dto: CreatePostDto): Promise<Post> {
    const post = this.postRepository.create(dto);
    if (this.embeddingsService.apiKey) {
      post.embedding = await this.embeddingsService.embedText(
        this.buildEmbeddingText(post),
      );
    }
    return this.postRepository.save(post);
  }

  async update(id: string, dto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id);
    Object.assign(post, dto);

    const shouldReEmbed =
      dto.title !== undefined ||
      dto.excerpt !== undefined ||
      dto.content !== undefined;
    if (shouldReEmbed && this.embeddingsService.apiKey) {
      post.embedding = await this.embeddingsService.embedText(
        this.buildEmbeddingText(post),
      );
    }

    return this.postRepository.save(post);
  }

  async remove(id: string): Promise<void> {
    const post = await this.findOne(id);
    await this.postRepository.remove(post);
  }
}
