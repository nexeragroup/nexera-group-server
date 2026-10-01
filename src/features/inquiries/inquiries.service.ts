import { Inject, Injectable } from '@nestjs/common';
import * as config_1 from '@nestjs/config';
import { randomUUID } from 'node:crypto';

import { NotificationsService } from '../notifications/notifications.service';
import { NewInquiry } from './dto/inquiries.dto';
import { createInquiryEmail } from './templates/inquiry-email.template';
import inquiryConfig from '../../config/inquiry.config';

@Injectable()
export class InquiriesService {
  constructor(
    private readonly notificationsService: NotificationsService,

    @Inject(inquiryConfig.KEY)
    private readonly config: config_1.ConfigType<typeof inquiryConfig>,
  ) {}

  async submitInquiry(dto: NewInquiry): Promise<{
    message: string;
    reference: string;
  }> {
    const emailContent = createInquiryEmail(dto, this.config.subjectPrefix);

    const ccEmails =
      this.config.ccEmails.length > 0 ? this.config.ccEmails : undefined;

    const notification = await this.notificationsService.sendEmail({
      to: this.config.receiverEmail,

      cc: ccEmails,

      /**
       * Clicking Reply sends the response
       * directly to the client.
       */
      replyTo: dto.email,

      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,

      sourceService: 'nexera-client',
      requestedBy: dto.email,

      idempotencyKey: `website-inquiry-${randomUUID()}`,

      metadata: {
        type: 'WEBSITE_INQUIRY',

        client: {
          names: dto.names,
          email: dto.email,
          phone: dto.phone ?? null,
          company: dto.company ?? null,
        },

        inquiry: {
          service: dto.service,
          budget: dto.budget ?? null,
          projectDetails: dto.projectDetails,
        },

        delivery: {
          receiver: this.config.receiverEmail,
          cc: this.config.ccEmails,
        },
      },
    });

    return {
      message: 'Thank you. Your inquiry has been sent successfully.',

      reference: notification.id,
    };
  }
}
