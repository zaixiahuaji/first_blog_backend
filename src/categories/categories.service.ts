import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Category } from './category.entity';
import {
  DEFAULT_CATEGORY_COLOR,
  RESERVED_CATEGORY_SLUGS,
  SYSTEM_CATEGORIES_SEED,
  SYSTEM_CATEGORY_SLUGS,
  THEME_COLORS,
  type ThemeColor,
} from './categories.constants';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly dataSource: DataSource,
  ) {}

  private normalizeSlug(slug: string): string {
    return slug.trim().toLowerCase();
  }

  private assertSlugAllowed(slug: string): void {
    if (RESERVED_CATEGORY_SLUGS.includes(slug as any)) {
      throw new BadRequestException(`Category slug "${slug}" is reserved.`);
    }
  }

  private assertThemeColor(color: string): asserts color is ThemeColor {
    if (!THEME_COLORS.includes(color as any)) {
      throw new BadRequestException('Color must be one of the theme colors.');
    }
  }

  async ensureSystemCategories(): Promise<void> {
    const existing = await this.categoryRepository.find({
      where: { slug: In([...SYSTEM_CATEGORY_SLUGS]) },
    });
    const existingSlugs = new Set(existing.map((c) => c.slug));

    const toInsert = SYSTEM_CATEGORIES_SEED.filter(
      (seed) => !existingSlugs.has(seed.slug),
    ).map((seed) =>
      this.categoryRepository.create({
        slug: seed.slug,
        name: seed.name,
        color: seed.color,
        sortOrder: seed.sortOrder,
        isActive: seed.isActive,
        isSystem: true,
      }),
    );

    if (toInsert.length > 0) {
      await this.categoryRepository.save(toInsert);
    }
  }

  async findActive(): Promise<Array<Pick<Category, 'id' | 'slug' | 'name' | 'color' | 'sortOrder'>>> {
    const rows = await this.categoryRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    return rows.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      color: c.color,
      sortOrder: c.sortOrder,
    }));
  }

  async adminFindAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  private async getNextSortOrder(): Promise<number> {
    const raw = await this.categoryRepository
      .createQueryBuilder('c')
      .select('MAX(c.sortOrder)', 'max')
      .getRawOne<{ max: string | null }>();
    const max = raw?.max != null ? Number(raw.max) : 0;
    return Number.isFinite(max) ? max + 10 : 10;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = this.normalizeSlug(dto.slug);
    this.assertSlugAllowed(slug);

    if (SYSTEM_CATEGORY_SLUGS.includes(slug as any)) {
      throw new BadRequestException(`Category slug "${slug}" is system-reserved.`);
    }

    this.assertThemeColor(dto.color);

    const exists = await this.categoryRepository.findOne({ where: { slug } });
    if (exists) {
      throw new ConflictException(`Category slug "${slug}" already exists.`);
    }

    const sortOrder = dto.sortOrder ?? (await this.getNextSortOrder());
    const category = this.categoryRepository.create({
      slug,
      name: dto.name.trim(),
      description: dto.description?.trim() ?? null,
      color: dto.color as ThemeColor,
      sortOrder,
      isActive: dto.isActive ?? true,
      isSystem: false,
    });
    return this.categoryRepository.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    if (dto.color !== undefined) {
      this.assertThemeColor(dto.color);
      category.color = dto.color as ThemeColor;
    }

    if (dto.name !== undefined) category.name = dto.name.trim();
    if (dto.description !== undefined) category.description = dto.description;
    if (dto.sortOrder !== undefined) category.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) category.isActive = dto.isActive;

    return this.categoryRepository.save(category);
  }

  async reorder(dto: ReorderCategoriesDto): Promise<void> {
    const orderedIds = dto.orderedIds;
    const unique = new Set(orderedIds);
    if (unique.size !== orderedIds.length) {
      throw new BadRequestException('orderedIds must not contain duplicates.');
    }

    const categories = await this.categoryRepository.find({
      where: { id: In(orderedIds) },
    });
    if (categories.length !== orderedIds.length) {
      throw new BadRequestException('orderedIds contains unknown category id.');
    }

    const base = 10;
    const step = 10;
    const nextSortOrderById = new Map<string, number>();
    orderedIds.forEach((id, idx) => {
      nextSortOrderById.set(id, base + idx * step);
    });

    await this.dataSource.transaction(async (manager) => {
      for (const category of categories) {
        const nextSortOrder = nextSortOrderById.get(category.id);
        if (nextSortOrder === undefined) continue;
        await manager.update(
          Category,
          { id: category.id },
          { sortOrder: nextSortOrder },
        );
      }
    });
  }

  private async mustGetOtherCategory(): Promise<Category> {
    const other = await this.categoryRepository.findOne({
      where: { slug: 'other' },
    });
    if (!other) {
      // 理论上 system seed 会保证存在；这里属于异常态保护
      throw new ConflictException('System category "other" is missing.');
    }
    return other;
  }

  async remove(id: string): Promise<void> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    if (category.isSystem) {
      throw new ConflictException('System category cannot be deleted.');
    }

    const other = await this.mustGetOtherCategory();

    await this.dataSource.transaction(async (manager) => {
      // 将该类别文章迁移到 other
      await manager.query(
        'UPDATE posts SET "categoryId" = $1 WHERE "categoryId" = $2',
        [other.id, category.id],
      );
      await manager.delete(Category, { id: category.id });
    });
  }

  async ensureThemeDefaults(): Promise<void> {
    // 兜底：确保默认色在主题色集合里（避免 constants 被改坏）
    if (!THEME_COLORS.includes(DEFAULT_CATEGORY_COLOR)) {
      throw new Error('DEFAULT_CATEGORY_COLOR is not in THEME_COLORS.');
    }
  }
}

