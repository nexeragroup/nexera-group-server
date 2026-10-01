import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, QueryFailedError } from 'typeorm';
import {
  CreateProjectDto,
  ProjectQueryDto,
  UpdateProjectDto,
} from './dto/project.dto';
import { ProjectsEntity } from './entity/projects.entity';
import { TechnologiesEntity } from '../technologies/entity/technologies.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectsEntity)
    private readonly projectsRepository: Repository<ProjectsEntity>,

    @InjectRepository(TechnologiesEntity)
    private readonly technologiesRepository: Repository<TechnologiesEntity>,
  ) {}

  async createBulk(items: CreateProjectDto[]): Promise<ProjectsEntity[]> {
    if (items.length < 1 || items.length > 100) {
      throw new BadRequestException('Provide 1 to 100 items');
    }
    const slugs = items.map((item) => item.slug.trim().toLowerCase());
    if (new Set(slugs).size !== slugs.length) {
      throw new ConflictException('Duplicate slugs in bulk request');
    }
    try {
      return await this.projectsRepository.manager.transaction(
        async (manager) => {
          const service = new ProjectsService(
            manager.getRepository(ProjectsEntity),
            manager.getRepository(TechnologiesEntity),
          );
          const created: ProjectsEntity[] = [];
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

  async create(dto: CreateProjectDto): Promise<ProjectsEntity> {
    await this.ensureSlugAvailable(dto.slug);

    const technologies = await this.resolveTechnologies(dto.technologyIds);

    const project = this.projectsRepository.create({
      slug: dto.slug.trim().toLowerCase(),
      code: dto.code.trim().toUpperCase(),
      name: dto.name.trim(),
      category: dto.category.trim(),
      headline: dto.headline.trim(),
      description: dto.description.trim(),
      technologies,
      link: dto.link?.trim() || null,
      linkLabel: dto.linkLabel?.trim() || null,
      imageUrl: dto.imageUrl?.trim() || null,
      featured: dto.featured ?? false,
      active: dto.active ?? true,
    });

    return this.projectsRepository.save(project);
  }

  /**
   * Public portfolio listing.
   *
   * Only active projects are returned.
   */
  async findPublic(query: ProjectQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const builder = this.projectsRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect(
        'project.technologies',
        'technology',
        'technology.active = :technologyActive',
        { technologyActive: true },
      )
      .where('project.active = :active', {
        active: true,
      });

    if (query.category) {
      builder.andWhere('LOWER(project.category) = LOWER(:category)', {
        category: query.category.trim(),
      });
    }

    if (typeof query.featured === 'boolean') {
      builder.andWhere('project.featured = :featured', {
        featured: query.featured,
      });
    }

    if (query.search?.trim()) {
      builder.andWhere(
        `
        (
          project.name ILIKE :search
          OR project.headline ILIKE :search
          OR project.description ILIKE :search
          OR project.category ILIKE :search
        )
        `,
        {
          search: `%${query.search.trim()}%`,
        },
      );
    }

    builder
      .orderBy('project.featured', 'DESC')
      .addOrderBy('project.createdAt', 'DESC')
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
   * Admin listing.
   *
   * Includes inactive projects.
   */
  async findAllAdmin(query: ProjectQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const builder = this.projectsRepository.createQueryBuilder('project');

    if (query.category) {
      builder.andWhere('LOWER(project.category) = LOWER(:category)', {
        category: query.category.trim(),
      });
    }

    if (typeof query.featured === 'boolean') {
      builder.andWhere('project.featured = :featured', {
        featured: query.featured,
      });
    }

    if (query.search?.trim()) {
      builder.andWhere(
        `
        (
          project.name ILIKE :search
          OR project.code ILIKE :search
          OR project.headline ILIKE :search
          OR project.description ILIKE :search
          OR project.category ILIKE :search
        )
        `,
        {
          search: `%${query.search.trim()}%`,
        },
      );
    }

    builder
      .orderBy('project.createdAt', 'DESC')
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

  async findOne(id: string): Promise<ProjectsEntity> {
    const project = await this.projectsRepository.findOne({
      where: {
        id,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async findPublicBySlug(slug: string): Promise<ProjectsEntity> {
    const project = await this.projectsRepository.findOne({
      where: {
        slug,
        active: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<ProjectsEntity> {
    const project = await this.findOne(id);

    if (dto.slug && dto.slug.toLowerCase() !== project.slug.toLowerCase()) {
      await this.ensureSlugAvailable(dto.slug, id);

      project.slug = dto.slug.trim().toLowerCase();
    }

    if (dto.code !== undefined) {
      project.code = dto.code.trim().toUpperCase();
    }

    if (dto.name !== undefined) {
      project.name = dto.name.trim();
    }

    if (dto.category !== undefined) {
      project.category = dto.category.trim();
    }

    if (dto.headline !== undefined) {
      project.headline = dto.headline.trim();
    }

    if (dto.description !== undefined) {
      project.description = dto.description.trim();
    }

    if (dto.technologyIds !== undefined) {
      project.technologies = await this.resolveTechnologies(dto.technologyIds);
    }

    if (dto.link !== undefined) {
      project.link = dto.link?.trim() || null;
    }

    if (dto.linkLabel !== undefined) {
      project.linkLabel = dto.linkLabel?.trim() || null;
    }

    if (dto.imageUrl !== undefined) {
      project.imageUrl = dto.imageUrl?.trim() || null;
    }

    if (dto.featured !== undefined) {
      project.featured = dto.featured;
    }

    if (dto.active !== undefined) {
      project.active = dto.active;
    }

    return this.projectsRepository.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);

    await this.projectsRepository.softRemove(project);
  }

  async restore(id: string): Promise<ProjectsEntity> {
    const project = await this.projectsRepository.findOne({
      where: {
        id,
      },
      withDeleted: true,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.projectsRepository.restore(id);

    return this.findOne(id);
  }

  private async ensureSlugAvailable(
    slug: string,
    excludeId?: string,
  ): Promise<void> {
    const normalizedSlug = slug.trim().toLowerCase();

    const builder = this.projectsRepository
      .createQueryBuilder('project')
      .withDeleted()
      .where('LOWER(project.slug) = LOWER(:slug)', { slug: normalizedSlug });

    if (excludeId) {
      builder.andWhere('project.id != :excludeId', {
        excludeId,
      });
    }

    const existing = await builder.getOne();

    if (existing) {
      throw new ConflictException(
        `Project with slug "${normalizedSlug}" already exists`,
      );
    }
  }

  private async resolveTechnologies(
    technologyIds: string[],
  ): Promise<TechnologiesEntity[]> {
    const ids = [...new Set(technologyIds)];
    if (ids.length === 0) {
      return [];
    }

    const technologies = await this.technologiesRepository.find({
      where: {
        id: In(ids),
        active: true,
      },
    });

    if (technologies.length !== ids.length) {
      const foundIds = new Set(technologies.map((technology) => technology.id));
      const missingIds = ids.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `One or more technologies were not found or are inactive: ${missingIds.join(', ')}`,
      );
    }

    return technologies;
  }
}
