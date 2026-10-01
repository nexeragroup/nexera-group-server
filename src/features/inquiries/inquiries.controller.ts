import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { InquiriesService } from './inquiries.service';

import { Throttle } from '@nestjs/throttler';
import { NewInquiry } from './dto/inquiries.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  submitInquiry(@Body() body: NewInquiry) {
    return this.inquiriesService.submitInquiry(body);
  }
}
