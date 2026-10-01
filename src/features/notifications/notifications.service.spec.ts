import { jest } from '@jest/globals';
import { NotificationChannel } from './enums/notification-channel.enum';
import { NotificationStatus } from './enums/notification-status.enum';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  it('persists and records a delivered email notification', async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((notification) => notification),
      save: jest.fn(async (notification) => ({
        ...notification,
        id: notification.id ?? 'notification-id',
      })),
    };
    const mailTransport = {
      deliver: jest.fn().mockResolvedValue({ messageId: 'provider-id' }),
    };
    const service = new NotificationsService(
      repository as never,
      mailTransport as never,
    );

    await expect(
      service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Hello',
        text: 'Message',
        idempotencyKey: 'notification-1',
      }),
    ).resolves.toEqual({
      id: 'notification-id',
      channel: NotificationChannel.EMAIL,
      status: NotificationStatus.SENT,
      providerMessageId: 'provider-id',
    });

    expect(mailTransport.deliver).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'recipient@example.com',
        subject: 'Hello',
      }),
      'notification-id',
    );
  });

  it('returns a previous successful request without sending twice', async () => {
    const existing = {
      id: 'notification-id',
      channel: NotificationChannel.EMAIL,
      status: NotificationStatus.SENT,
      providerMessageId: 'provider-id',
    };
    const repository = { findOne: jest.fn().mockResolvedValue(existing) };
    const mailTransport = { deliver: jest.fn() };
    const service = new NotificationsService(
      repository as never,
      mailTransport as never,
    );

    await expect(
      service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Hello',
        text: 'Message',
        idempotencyKey: 'notification-1',
      }),
    ).resolves.toEqual(existing);

    expect(mailTransport.deliver).not.toHaveBeenCalled();
  });
});
