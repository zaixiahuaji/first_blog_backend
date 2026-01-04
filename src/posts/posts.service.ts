import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Category } from '../categories/category.entity';
import { Post } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ListPostsQueryDto } from './dto/list-posts.query.dto';
import { EmbeddingsService } from './embeddings.service';
import {
  PostsCategoriesStatsDto,
  PostsTotalDto,
} from './dto/posts-stats.dto';
import { PostDto } from './dto/post.dto';

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

type SortField = NonNullable<ListPostsQueryDto['sort']>;

type CurrentUser = {
  username?: string;
  role?: string;
};

type SeedPost = {
  username: string;
  title: string;
  categorySlug: string;
  date: string;
  excerpt: string;
  content: string;
};

const DEFAULT_POSTS: SeedPost[] = [
  {
    username: '滑稽',
    title: '模拟复兴（AI生成）',
    categorySlug: 'tech',
    date: '2023-11-05',
    excerpt: '为何我们在触摸屏的世界中回归触觉界面。按键的咔哒声很重要。',
    content:
      '在触摸屏主导的今天，物理反馈的缺失让人感到空虚。机械键盘的敲击声、老式收音机的旋钮阻尼，这些触觉体验不仅仅是怀旧，更是人机交互中不可或缺的确认感。模拟复兴不是倒退，而是重新找回被数字洪流冲刷掉的质感。',
  },
  {
    username: '滑稽',
    title: '霓虹夜与城市之光（AI生成）',
    categorySlug: 'visuals',
    date: '2023-10-31',
    excerpt: '探索80年代末动画的赛博黑色美学及其对现代网页设计的影响。',
    content:
      '赛博朋克美学不仅仅是霓虹灯和雨夜。它探讨的是高科技与低生活的反差。80年代末的动画作品通过高对比度的色彩、复杂的机械细节和阴郁的氛围，构建了一个既迷人又危险的未来。这种视觉语言正在现代网页设计中复苏，提醒我们关注技术的阴暗面。',
  },
  {
    username: '滑稽',
    title: '合成器基础（AI生成）',
    categorySlug: 'music',
    date: '2023-10-15',
    excerpt: '了解FM合成与减法合成的区别。让我们制造一些噪音。',
    content:
      '合成器不仅仅是制造声音的机器，它们是塑造情绪的工具。FM合成带来金属质感的冰冷音色，而减法合成则提供温暖厚实的基底。掌握波形、包络和滤波器的关系，你就能从无到有地构建出属于未来的声音图景。',
  },
  {
    username: '滑稽',
    title: '磁带维护 101（AI生成）',
    categorySlug: 'tech',
    date: '2023-09-22',
    excerpt: '如何仅用一支铅笔和耐心修复缠绕的磁带。不要丢失你的记忆。',
    content:
      '磁带是脆弱的记忆载体，但也是有温度的。当磁带缠绕时，不要慌张。准备一支六棱铅笔，轻轻插入卷轴孔，顺时针缓慢旋转。这不仅是修复物理介质，更是一场与过去时光的微型手术。保持耐心，记忆终将归位。',
  },
  {
    username: '滑稽',
    title: '虚空中的矢量（AI生成）',
    categorySlug: 'visuals',
    date: '2023-09-10',
    excerpt: '线框图形之美。当更少的几何形状意味着更多的想象力。',
    content:
      '早期计算机图形学的限制造就了独特的矢量美学。在算力匮乏的年代，仅用简单的线条和几何形状构建三维空间，需要极大的创造力。这种极简主义在今天依然具有震撼力，它告诉我们：限制往往是创新的催化剂。',
  },
  {
    username: '滑稽',
    title: '暗潮播放列表（AI生成）',
    categorySlug: 'music',
    date: '2023-08-30',
    excerpt: '深夜黑客会话的精选曲目。为明亮头脑准备的阴郁节拍。',
    content:
      '当城市沉睡，代码在屏幕上跳动，你需要一份特殊的背景音。这里精选了最具沉浸感的暗潮（Darkwave）与合成波曲目。低沉的贝斯线、若隐若现的人声采样，加上稳定的鼓点，助你潜入数字世界的深层。',
  },
  {
    username: '滑稽',
    title: '系统过载（AI生成）',
    categorySlug: 'tech',
    date: '2023-08-15',
    excerpt: '当CPU温度达到临界值时发生的奇妙现象。硬件的极限在哪里？',
    content:
      '当散热曲线被拉到尽头，硬件会用最直白的方式提醒你：降频、卡顿、甚至瞬间重启。所谓“过载”并不神秘，它是温度、电流与时间共同写下的边界。理解这些边界，你才知道该把性能留给哪里，把余量留给谁。',
  },
  {
    username: '滑稽',
    title: '像素艺术概论（AI生成）',
    categorySlug: 'visuals',
    date: '2023-08-01',
    excerpt: '在有限的分辨率下创造无限的世界。每一个点都有意义。',
    content:
      '像素艺术的魅力来自“限制”：固定的网格、有限的颜色、清晰的轮廓。把光影、材质、情绪压缩到几个像素里，本质上是在做取舍。学会用最少的信息讲最完整的故事，你也就学会了设计。',
  },
  {
    username: '滑稽',
    title: '低保真波形（AI生成）',
    categorySlug: 'music',
    date: '2023-07-20',
    excerpt: '为什么Lo-Fi音乐能提高专注力？噪声背后的科学。',
    content:
      'Lo-Fi 的“噪声”并不是缺陷，而是刻意保留的背景：磁带底噪、轻微失真、房间混响。它们给大脑一个稳定的参照系，让注意力更容易落在任务上。于是波形不再追求完美，而是在可控的粗糙里保持节奏。',
  },
  {
    username: '滑稽',
    title: '工业设计美学（AI生成）',
    categorySlug: 'visuals',
    date: '2023-07-10',
    excerpt: 'Braun设计语言与现代UI的碰撞。少即是多。',
    content:
      'Braun 的设计语言强调克制：明确的层级、可靠的触感、可预测的操作路径。把这种思路搬到 UI 上，就会得到更少的装饰、更清晰的反馈，以及更稳定的秩序感。当界面像工具一样诚实，审美自然就出现了。',
  },
  {
    username: '滑稽',
    title: '软盘数据恢复（AI生成）',
    categorySlug: 'tech',
    date: '2023-06-25',
    excerpt: '从损坏的磁性介质中提取数据。数字考古学入门。',
    content:
      '软盘像一块脆弱的记忆薄片：磁层会老化，目录会损坏，读写头会偏移。恢复的第一步不是强行读取，而是尽可能减少二次伤害：换驱动、调校对位、先做镜像、再在镜像上分析。数字考古的核心，是对每一次读取都保持敬畏。',
  },
  {
    username: '滑稽',
    title: '深网协议（AI生成）',
    categorySlug: 'tech',
    date: '2023-06-01',
    excerpt: '在万维网出现之前的通信协议。BBS与其遗产。',
    content:
      '在 HTTP 统治一切之前，BBS、拨号与各种专有协议曾是网络的底层语言。它们速度慢、功能简单，却也因此更直接、更可感。回望这些协议，并不是为了复古，而是为了理解：网络最初的意义，是让人彼此抵达。',
  },
];

@Injectable()
export class PostsService {
  private embeddingsBackfilled = false;
  private embeddingsServiceDisabled = false;
  private vectorSearchDisabled = false;
  private backfillPromise: Promise<void> | null = null;
  private seedAuthorMigrated = false;
  private readonly logger = new Logger(PostsService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  private normalizeQuery(q?: string): string {
    return (q ?? '').trim();
  }

  private toPostDto(post: Post): PostDto {
    return {
      id: post.id,
      username: post.username,
      title: post.title,
      category: post.category?.slug ?? 'other',
      date: post.date,
      excerpt: post.excerpt,
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  private async ensureSeeded(): Promise<void> {
    const count = await this.postRepository.count();
    if (count > 0) {
      await this.migrateLegacySeedAuthorOnce();
      return;
    }

    const neededSlugs = Array.from(
      new Set(DEFAULT_POSTS.map((post) => post.categorySlug)),
    );

    const categories = await this.categoryRepository.find({
      where: { slug: In(neededSlugs) },
    });
    const idBySlug = new Map(categories.map((c) => [c.slug, c.id]));

    const other = await this.categoryRepository.findOne({
      where: { slug: 'other' },
    });
    if (!other) {
      this.logger.warn('System category "other" is missing; auto-creating.');
      const created = this.categoryRepository.create({
        slug: 'other',
        name: '其他',
        color: '#00aaaa',
        sortOrder: 40,
        isActive: true,
        isSystem: true,
      });
      const saved = await this.categoryRepository.save(created);
      return this.seedPostsWithFallback(saved.id, idBySlug);
    }

    await this.seedPostsWithFallback(other.id, idBySlug);
  }

  private async migrateLegacySeedAuthorOnce(): Promise<void> {
    if (this.seedAuthorMigrated) return;
    this.seedAuthorMigrated = true;
    if (process.env.NODE_ENV === 'production') return;

    const legacyUsername: string = 'admin';
    const nextUsername: string = '滑稽';

    const titles = DEFAULT_POSTS.map((post) => post.title);
    if (titles.length === 0) return;

    await this.postRepository
      .createQueryBuilder()
      .update(Post)
      .set({ username: nextUsername })
      .where('username = :legacyUsername', { legacyUsername })
      .andWhere('title IN (:...titles)', { titles })
      .execute();
  }

  private async seedPostsWithFallback(
    otherCategoryId: string,
    idBySlug: Map<string, string>,
  ): Promise<void> {
    const seeded = this.postRepository.create(
      DEFAULT_POSTS.map((seed) => ({
        username: seed.username,
        title: seed.title,
        categoryId: idBySlug.get(seed.categorySlug) ?? otherCategoryId,
        date: seed.date,
        excerpt: seed.excerpt,
        content: seed.content,
      })),
    );
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

    // 外部 embeddings 服务不可用时，不要影响基础 CRUD
    if (this.embeddingsServiceDisabled) return;

    if (this.backfillPromise) return this.backfillPromise;

    this.backfillPromise = (async () => {
      try {
        const missing = await this.postRepository.find({
          where: { embedding: IsNull() },
          order: { createdAt: 'ASC' },
        });

        for (const post of missing) {
          const text = this.buildEmbeddingText(post);
          try {
            const embedding = await this.embeddingsService.embedText(text);
            post.embedding = embedding;
            await this.postRepository.save(post);
          } catch (e) {
            this.embeddingsServiceDisabled = true;
            this.logger.warn(
              'Embeddings backfill failed; disabled for this run.',
            );
            this.logger.debug((e as any)?.stack ?? String(e));
            return;
          }
        }

        this.embeddingsBackfilled = true;
      } catch (e) {
        this.embeddingsServiceDisabled = true;
        this.logger.warn('Embeddings backfill failed; disabled for this run.');
        this.logger.debug((e as any)?.stack ?? String(e));
      }
    })().finally(() => {
      this.backfillPromise = null;
    });

    return this.backfillPromise;
  }

  async findAll(
    queryDto: ListPostsQueryDto,
  ): Promise<PaginatedResult<PostDto>> {
    await this.ensureSeeded();
    void this.backfillEmbeddingsOnce();

    const page = queryDto.page ?? 1;
    const limit = queryDto.limit ?? 20;
    const sort = queryDto.sort ?? 'createdAt';
    const order = queryDto.order ?? 'DESC';
    let q = this.normalizeQuery(queryDto.q);
    const vectorQ = this.normalizeQuery(queryDto.vectorQ);
    const categorySlug = queryDto.category;

    const qb = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.category', 'category');

    if (categorySlug) {
      const category = await this.categoryRepository.findOne({
        where: { slug: categorySlug },
      });
      if (!category) {
        return { items: [], total: 0, page, limit };
      }
      qb.andWhere('post.categoryId = :categoryId', { categoryId: category.id });
    }

    // vectorQ 优先：有语义搜索就走 pgvector；否则走原有 ILIKE 关键词搜索
    if (vectorQ) {
      if (
        this.vectorSearchDisabled ||
        this.embeddingsServiceDisabled ||
        !this.embeddingsService.apiKey
      ) {
        q = q || vectorQ;
      } else {
        let queryEmbedding: number[] | null = null;
        try {
          queryEmbedding = await this.embeddingsService.embedText(vectorQ);
        } catch (e) {
          this.embeddingsServiceDisabled = true;
          this.logger.warn(
            'Embeddings service failed; fallback to keyword search.',
          );
          this.logger.debug((e as any)?.stack ?? String(e));
          q = q || vectorQ;
        }

        if (queryEmbedding) {
          try {
            const vectorQb = qb.clone();
            vectorQb.andWhere('post.embedding IS NOT NULL');
            vectorQb.setParameter(
              'qEmbedding',
              this.toVectorLiteral(queryEmbedding),
            );
            vectorQb.addSelect(
              'post.embedding <-> :qEmbedding::vector',
              'distance',
            );
            vectorQb.orderBy('distance', 'ASC');
            vectorQb.skip((page - 1) * limit).take(limit);

            const [items, total] = await vectorQb.getManyAndCount();
            return {
              items: items.map((post) => this.toPostDto(post)),
              total,
              page,
              limit,
            };
          } catch (e) {
            this.vectorSearchDisabled = true;
            this.logger.warn(
              'Vector search failed; fallback to keyword search.',
            );
            this.logger.debug((e as any)?.stack ?? String(e));
            q = q || vectorQ;
          }
        }
      }
    }

    if (q) {
      qb.andWhere(
        '(post.title ILIKE :q OR post.excerpt ILIKE :q OR post.content ILIKE :q OR post.username ILIKE :q)',
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
    return {
      items: items.map((post) => this.toPostDto(post)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<PostDto> {
    await this.ensureSeeded();
    const post = await this.postRepository.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    return this.toPostDto(post);
  }

  async getTotal(): Promise<PostsTotalDto> {
    await this.ensureSeeded();
    const total = await this.postRepository.count();
    return { total };
  }

  async getCategoriesStats(): Promise<PostsCategoriesStatsDto> {
    await this.ensureSeeded();

    const categories = await this.categoryRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    const counts = await this.postRepository
      .createQueryBuilder('post')
      .select('post.categoryId', 'categoryId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('post.categoryId')
      .getRawMany<{ categoryId: string; count: string }>();

    const countByCategoryId = new Map(
      counts.map((row) => [row.categoryId, Number(row.count)]),
    );

    return {
      categories: categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.name,
        color: category.color,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
        isSystem: category.isSystem,
        count: countByCategoryId.get(category.id) ?? 0,
      })),
    };
  }

  private assertCurrentUser(user: CurrentUser): asserts user is {
    username: string;
    role: string;
  } {
    if (!user?.username || !user?.role) {
      throw new BadRequestException('Missing user context');
    }
  }

  private assertAuthorOrAdmin(
    user: { username: string; role: string },
    post: { username: string },
  ) {
    if (user.role === 'admin' || user.role === 'super_admin') return;
    if (post.username !== user.username) {
      throw new ForbiddenException('Only author can operate this post');
    }
  }

  private async mustGetCategoryBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { slug },
    });
    if (!category) {
      throw new BadRequestException(`Category "${slug}" not found`);
    }
    return category;
  }

  async create(dto: CreatePostDto, currentUser: CurrentUser): Promise<PostDto> {
    this.assertCurrentUser(currentUser);

    const category = await this.mustGetCategoryBySlug(dto.category);
    if (!category.isActive) {
      throw new BadRequestException('Category is inactive');
    }

    const { category: _category, ...rest } = dto;
    const post = this.postRepository.create({
      ...rest,
      username: currentUser.username,
      categoryId: category.id,
    });
    post.category = category;

    if (this.embeddingsService.apiKey && !this.embeddingsServiceDisabled) {
      try {
        post.embedding = await this.embeddingsService.embedText(
          this.buildEmbeddingText(post),
        );
      } catch (e) {
        this.embeddingsServiceDisabled = true;
        this.logger.warn('Embeddings generate failed; continue without it.');
        this.logger.debug((e as any)?.stack ?? String(e));
        post.embedding = null;
      }
    }
    const saved = await this.postRepository.save(post);
    saved.category = category;
    return this.toPostDto(saved);
  }

  async update(
    id: string,
    dto: UpdatePostDto,
    currentUser: CurrentUser,
  ): Promise<PostDto> {
    this.assertCurrentUser(currentUser);

    const post = await this.postRepository.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!post) throw new NotFoundException('Post not found');

    this.assertAuthorOrAdmin(currentUser, post);

    const nextCategorySlug = dto.category;
    const { category: _category, ...rest } = dto;
    Object.assign(post, rest);

    if (nextCategorySlug !== undefined) {
      const nextCategory = await this.mustGetCategoryBySlug(nextCategorySlug);
      const isCategoryChanged = nextCategory.id !== post.categoryId;
      if (isCategoryChanged && !nextCategory.isActive) {
        throw new BadRequestException('Category is inactive');
      }
      post.categoryId = nextCategory.id;
      post.category = nextCategory;
    }

    const shouldReEmbed =
      dto.title !== undefined ||
      dto.excerpt !== undefined ||
      dto.content !== undefined;
    if (
      shouldReEmbed &&
      this.embeddingsService.apiKey &&
      !this.embeddingsServiceDisabled
    ) {
      try {
        post.embedding = await this.embeddingsService.embedText(
          this.buildEmbeddingText(post),
        );
      } catch (e) {
        this.embeddingsServiceDisabled = true;
        this.logger.warn('Embeddings generate failed; continue without it.');
        this.logger.debug((e as any)?.stack ?? String(e));
        post.embedding = null;
      }
    }

    const saved = await this.postRepository.save(post);
    saved.category = post.category;
    return this.toPostDto(saved);
  }

  async remove(id: string, currentUser: CurrentUser): Promise<void> {
    this.assertCurrentUser(currentUser);
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    this.assertAuthorOrAdmin(currentUser, post);
    await this.postRepository.remove(post);
  }
}
