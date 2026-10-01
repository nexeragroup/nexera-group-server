import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsEntity } from './entity/projects.entity';
import { TechnologiesEntity } from '../technologies/entity/technologies.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectsEntity, TechnologiesEntity])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
