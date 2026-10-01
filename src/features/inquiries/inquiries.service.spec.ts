import type { ConfigType } from '@nestjs/config';
import { jest } from '@jest/globals';
import inquiryConfig from '../../config/inquiry.config';
import { NotificationsService } from '../notifications/notifications.service';
import { InquiriesService } from './inquiries.service';

describe('InquiriesService', () => {
  it('sends the inquiry to the configured recipient', async () => {
    const notifications = {
      sendEmail: jest.fn().mockResolvedValue({ id: 'inquiry-id' }),
    };
    const config = {
      receiverEmail: 'sales@nexeragroup.rw',
      ccEmails: [],
      subjectPrefix: 'Nexera Group',
    } as ConfigType<typeof inquiryConfig>;
    const service = new InquiriesService(
      notifications as unknown as NotificationsService,
      config,
    );

    await expect(
      service.submitInquiry({
        names: 'Jane Doe',
        email: 'jane@example.com',
        service: 'Web development',
        projectDetails: 'A new website for our business.',
      }),
    ).resolves.toEqual({
      message: 'Thank you. Your inquiry has been sent successfully.',
      reference: 'inquiry-id',
    });

    expect(notifications.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'sales@nexeragroup.rw',
        replyTo: 'jane@example.com',
      }),
    );
  });
});
