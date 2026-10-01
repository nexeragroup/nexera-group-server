import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TechnologiesEntity } from './entity/technologies.entity';
import { TechnologiesController } from './technologies.controller';
import { TechnologiesService } from './technologies.service';

@Module({
  imports: [TypeOrmModule.forFeature([TechnologiesEntity])],
  controllers: [TechnologiesController],
  providers: [TechnologiesService],
  exports: [TechnologiesService],
})
export class TechnologiesModule {}
