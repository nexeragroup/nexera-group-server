import { BulkCreatePipe } from '../../common/pipes/bulk-create.pipe';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';

import { ProjectsService } from './projects.service';
import {
  ProjectQueryDto,
  CreateProjectDto,
  UpdateProjectDto,
} from './dto/project.dto';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ============================================================
  // PUBLIC
  // ============================================================

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Get public portfolio projects',
  })
  findPublic(@Query() query: ProjectQueryDto) {
    return this.projectsService.findPublic(query);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Get public portfolio project by slug',
  })
  findBySlug(@Param('slug') slug: string) {
    return this.projectsService.findPublicBySlug(slug);
  }

  // ============================================================
  // ADMIN
  // ============================================================

  @Get('admin/all')
  @Permissions('PROJECTS.READ')
  @ApiOperation({
    summary: 'Get all projects for administration',
  })
  findAllAdmin(@Query() query: ProjectQueryDto) {
    return this.projectsService.findAllAdmin(query);
  }

  @Get('admin/:id')
  @Permissions('PROJECTS.READ')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.findOne(id);
  }

  @Post('bulk')
  @Permissions('PROJECTS.CREATE')
  @ApiOperation({ summary: 'Create up to 100 projects atomically' })
  @ApiBody({ type: CreateProjectDto, isArray: true })
  createBulk(
    @Body(new BulkCreatePipe(CreateProjectDto)) items: CreateProjectDto[],
  ) {
    return this.projectsService.createBulk(items);
  }

  @Post()
  @Permissions('PROJECTS.CREATE')
  @ApiOperation({
    summary: 'Create portfolio project',
  })
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Patch(':id')
  @Permissions('PROJECTS.UPDATE')
  @ApiOperation({
    summary: 'Update portfolio project',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('PROJECTS.DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete portfolio project',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.projectsService.remove(id);
  }

  @Post(':id/restore')
  @Permissions('PROJECTS.UPDATE')
  @ApiOperation({
    summary: 'Restore deleted portfolio project',
  })
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.restore(id);
  }
}
