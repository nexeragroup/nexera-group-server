import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import {
  CreateTechnologyDto,
  TechnologyQueryDto,
  UpdateTechnologyDto,
} from './dto/technology.dto';
import { TechnologiesEntity } from './entity/technologies.entity';

@Injectable()
export class TechnologiesService {
  constructor(
    @InjectRepository(TechnologiesEntity)
    private readonly technologiesRepository: Repository<TechnologiesEntity>,
  ) {}

  async createBulk(
    items: CreateTechnologyDto[],
  ): Promise<TechnologiesEntity[]> {
    if (items.length < 1 || items.length > 100) {
      throw new BadRequestException('Provide 1 to 100 items');
    }
    const slugs = items.map((item) => item.slug.trim().toLowerCase());
    if (new Set(slugs).size !== slugs.length) {
      throw new ConflictException('Duplicate slugs in bulk request');
    }
    try {
      return await this.technologiesRepository.manager.transaction(
        async (manager) => {
          const service = new TechnologiesService(
            manager.getRepository(TechnologiesEntity),
          );
          const created: TechnologiesEntity[] = [];
          for (const item of items) {
            created.push(await service.create(item));
          }
          return created;
        },
      );
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException(
          'A record with one of these slugs already exists',
        );
      }
      throw error;
    }
  }

  async create(dto: CreateTechnologyDto): Promise<TechnologiesEntity> {
    const slug = dto.slug.trim().toLowerCase();
    await this.ensureSlugAvailable(slug);
    const technology = this.technologiesRepository.create({
      slug,
      name: dto.name.trim(),
      category: dto.category,
      description: dto.description?.trim() || null,
      websiteUrl: dto.websiteUrl?.trim() || null,
      logoUrl: dto.logoUrl?.trim() || null,
      active: dto.active ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });

    return this.technologiesRepository.save(technology);
  }

  /**
   * Public list.
   *
   * Returns active technologies only.
   */
  async findPublic(query: TechnologyQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const builder = this.technologiesRepository
      .createQueryBuilder('technology')
      .where('technology.active = :active', {
        active: true,
      });

    if (query.category) {
      builder.andWhere('technology.category = :category', {
        category: query.category,
      });
    }

    if (query.search?.trim()) {
      builder.andWhere(
        `
        (
          technology.name ILIKE :search
          OR technology.slug ILIKE :search
          OR technology.description ILIKE :search
        )
        `,
        {
          search: `%${query.search.trim()}%`,
        },
      );
    }

    builder
      .orderBy('technology.category', 'ASC')
      .addOrderBy('technology.sortOrder', 'ASC')
      .addOrderBy('technology.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await builder.getManyAndCount();

    return {
      data,

      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Administration list.
   *
   * Can contain active and inactive technologies.
   */
  async findAll(query: TechnologyQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const builder =
      this.technologiesRepository.createQueryBuilder('technology');

    if (typeof query.active === 'boolean') {
      builder.andWhere('technology.active = :active', {
        active: query.active,
      });
    }

    if (query.category) {
      builder.andWhere('technology.category = :category', {
        category: query.category,
      });
    }

    if (query.search?.trim()) {
      builder.andWhere(
        `
        (
          technology.name ILIKE :search
          OR technology.slug ILIKE :search
          OR technology.description ILIKE :search
        )
        `,
        {
          search: `%${query.search.trim()}%`,
        },
      );
    }

    builder
      .orderBy('technology.category', 'ASC')
      .addOrderBy('technology.sortOrder', 'ASC')
      .addOrderBy('technology.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await builder.getManyAndCount();

    return {
      data,

      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<TechnologiesEntity> {
    const technology = await this.technologiesRepository.findOne({
      where: {
        id,
      },
    });

    if (!technology) {
      throw new NotFoundException('Technology not found');
    }

    return technology;
  }

  async findBySlug(slug: string): Promise<TechnologiesEntity> {
    const technology = await this.technologiesRepository.findOne({
      where: {
        slug: slug.trim().toLowerCase(),
        active: true,
      },
    });

    if (!technology) {
      throw new NotFoundException('Technology not found');
    }

    return technology;
  }

  async update(
    id: string,
    dto: UpdateTechnologyDto,
  ): Promise<TechnologiesEntity> {
    const technology = await this.findOne(id);

    if (dto.slug && dto.slug.trim().toLowerCase() !== technology.slug) {
      const slug = dto.slug.trim().toLowerCase();

      await this.ensureSlugAvailable(slug, id);

      technology.slug = slug;
    }

    if (dto.name !== undefined) {
      technology.name = dto.name.trim();
    }

    if (dto.category !== undefined) {
      technology.category = dto.category;
    }

    if (dto.description !== undefined) {
      technology.description = dto.description?.trim() || null;
    }

    if (dto.websiteUrl !== undefined) {
      technology.websiteUrl = dto.websiteUrl?.trim() || null;
    }

    if (dto.logoUrl !== undefined) {
      technology.logoUrl = dto.logoUrl?.trim() || null;
    }

    if (dto.active !== undefined) {
      technology.active = dto.active;
    }

    if (dto.sortOrder !== undefined) {
      technology.sortOrder = dto.sortOrder;
    }

    return this.technologiesRepository.save(technology);
  }

  async remove(id: string): Promise<void> {
    const technology = await this.technologiesRepository.findOne({
      where: {
        id,
      },

      relations: {
        projects: true,
      },
    });

    if (!technology) {
      throw new NotFoundException('Technology not found');
    }

    /**
     * Prevent deleting technologies that are
     * currently assigned to portfolio projects.
     */
    if (technology.projects.length > 0) {
      throw new ConflictException(
        `Technology "${technology.name}" is currently used by ${technology.projects.length} project(s)`,
      );
    }

    await this.technologiesRepository.softRemove(technology);
  }

  async restore(id: string): Promise<TechnologiesEntity> {
    const technology = await this.technologiesRepository.findOne({
      where: {
        id,
      },
      withDeleted: true,
    });

    if (!technology) {
      throw new NotFoundException('Technology not found');
    }

    await this.technologiesRepository.restore(id);

    return this.findOne(id);
  }

  private async ensureSlugAvailable(
    slug: string,
    excludeId?: string,
  ): Promise<void> {
    const builder = this.technologiesRepository
      .createQueryBuilder('technology')
      .withDeleted()
      .where('LOWER(technology.slug) = LOWER(:slug)', {
        slug,
      });

    if (excludeId) {
      builder.andWhere('technology.id != :excludeId', {
        excludeId,
      });
    }

    const existing = await builder.getOne();

    if (existing) {
      throw new ConflictException(
        `Technology with slug "${slug}" already exists`,
      );
    }
  }
}
