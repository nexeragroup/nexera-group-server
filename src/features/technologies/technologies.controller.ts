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

import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import {
  TechnologyQueryDto,
  CreateTechnologyDto,
  UpdateTechnologyDto,
} from './dto/technology.dto';
import { TechnologiesService } from './technologies.service';

@ApiTags('Technologies')
@Controller('technologies')
export class TechnologiesController {
  constructor(private readonly technologiesService: TechnologiesService) {}

  // ============================================================
  // PUBLIC
  // ============================================================

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Get active portfolio technologies',
  })
  findPublic(@Query() query: TechnologyQueryDto) {
    return this.technologiesService.findPublic(query);
  }

  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.technologiesService.findBySlug(slug);
  }

  // ============================================================
  // ADMIN
  // ============================================================

  @Get('admin/all')
  @Permissions('TECHNOLOGIES.READ')
  findAll(@Query() query: TechnologyQueryDto) {
    return this.technologiesService.findAll(query);
  }

  @Get('admin/:id')
  @Permissions('TECHNOLOGIES.READ')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.technologiesService.findOne(id);
  }

  @Post('bulk')
  @Permissions('TECHNOLOGIES.CREATE')
  @ApiOperation({ summary: 'Create up to 100 technologies atomically' })
  @ApiBody({ type: CreateTechnologyDto, isArray: true })
  createBulk(
    @Body(new BulkCreatePipe(CreateTechnologyDto)) items: CreateTechnologyDto[],
  ) {
    return this.technologiesService.createBulk(items);
  }

  @Post()
  @Permissions('TECHNOLOGIES.CREATE')
  create(@Body() dto: CreateTechnologyDto) {
    return this.technologiesService.create(dto);
  }

  @Patch(':id')
  @Permissions('TECHNOLOGIES.UPDATE')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTechnologyDto,
  ) {
    return this.technologiesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('TECHNOLOGIES.DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.technologiesService.remove(id);
  }

  @Post(':id/restore')
  @Permissions('TECHNOLOGIES.UPDATE')
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.technologiesService.restore(id);
  }
}
