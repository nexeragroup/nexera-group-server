import { jest } from '@jest/globals';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  it('uses the authenticated user as the notification requester', () => {
    const sendEmail = jest.fn();
    const controller = new NotificationsController({
      sendEmail,
    } as unknown as NotificationsService);

    controller.sendEmail(
      { to: 'recipient@example.com', subject: 'Hello', text: 'Message' },
      'user-id',
    );

    expect(sendEmail).toHaveBeenCalledWith({
      to: 'recipient@example.com',
      subject: 'Hello',
      text: 'Message',
      requestedBy: 'user-id',
    });
  });
});
