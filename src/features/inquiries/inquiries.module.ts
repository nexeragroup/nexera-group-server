import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import inquiryConfig from '../../config/inquiry.config';
import { NotificationsModule } from '../notifications/notifications.module';

import { InquiriesController } from './inquiries.controller';
import { InquiriesService } from './inquiries.service';

@Module({
  imports: [ConfigModule.forFeature(inquiryConfig), NotificationsModule],

  controllers: [InquiriesController],

  providers: [InquiriesService],

  exports: [InquiriesService],
})
export class InquiriesModule {}
