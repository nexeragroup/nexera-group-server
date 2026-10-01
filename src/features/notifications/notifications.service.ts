import {
  BadGatewayException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MailTransportService } from '../../common/services/mail-transport.service';
import { SendEmailNotificationDto } from './dto/send-email-notification.dto';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationChannel } from './enums/notification-channel.enum';
import { NotificationStatus } from './enums/notification-status.enum';

interface EmailChannelData {
  html?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,

    private readonly mailTransport: MailTransportService,
  ) {}

  /**
   * Persists and sends an email notification.
   */
  async sendEmail(dto: SendEmailNotificationDto): Promise<{
    id: string;
    channel: NotificationChannel;
    status: NotificationStatus;
    providerMessageId: string | null;
  }> {
    const existing = await this.findByIdempotencyKey(dto.idempotencyKey);

    if (existing) {
      if (existing.status === NotificationStatus.SENT) {
        return this.toResponse(existing);
      }

      throw new ConflictException({
        message: 'A notification with this idempotency key already exists.',
        notificationId: existing.id,
        status: existing.status,
      });
    }

    const channelData: EmailChannelData = {
      html: dto.html,
      cc: dto.cc,
      bcc: dto.bcc,
      replyTo: dto.replyTo,
    };

    const notification = await this.notificationRepository.save(
      this.notificationRepository.create({
        idempotencyKey: dto.idempotencyKey ?? null,
        channel: NotificationChannel.EMAIL,
        recipient: dto.to,
        title: dto.subject,
        body: dto.text ?? null,
        channelData: this.removeUndefinedValues(channelData),
        templateName: dto.templateName ?? null,
        templateData: dto.templateData ?? null,
        sourceService: dto.sourceService ?? 'unknown',
        requestedBy: dto.requestedBy ?? null,
        status: NotificationStatus.PENDING,
        provider: 'SMTP',
        providerMessageId: null,
        attemptCount: 0,
        lastAttemptAt: null,
        failureCode: null,
        failureReason: null,
        sentAt: null,
        metadata: dto.metadata ?? null,
      }),
    );

    return this.deliverEmail(notification);
  }

  /**
   * Retries a previously failed email notification.
   */
  async retryEmail(notificationId: string): Promise<{
    id: string;
    channel: NotificationChannel;
    status: NotificationStatus;
    providerMessageId: string | null;
  }> {
    const notification = await this.notificationRepository.findOne({
      where: {
        id: notificationId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    if (notification.channel !== NotificationChannel.EMAIL) {
      throw new ConflictException(
        'Only email notifications can currently be retried.',
      );
    }

    if (notification.status === NotificationStatus.SENT) {
      throw new ConflictException('The notification has already been sent.');
    }

    return this.deliverEmail(notification);
  }

  /**
   * Returns a single notification audit record.
   */
  async findOne(notificationId: string): Promise<NotificationEntity> {
    const notification = await this.notificationRepository.findOne({
      where: {
        id: notificationId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    return notification;
  }

  private async deliverEmail(notification: NotificationEntity): Promise<{
    id: string;
    channel: NotificationChannel;
    status: NotificationStatus;
    providerMessageId: string | null;
  }> {
    const channelData = this.asEmailChannelData(notification.channelData);

    notification.status = NotificationStatus.PROCESSING;
    notification.attemptCount += 1;
    notification.lastAttemptAt = new Date();
    notification.failureCode = null;
    notification.failureReason = null;

    await this.notificationRepository.save(notification);

    try {
      const result = await this.mailTransport.deliver(
        {
          to: notification.recipient,
          cc: channelData.cc,
          bcc: channelData.bcc,
          replyTo: channelData.replyTo,
          subject: notification.title ?? '',
          text: notification.body ?? undefined,
          html: channelData.html,
        },
        notification.id,
      );

      notification.status = NotificationStatus.SENT;
      notification.providerMessageId =
        typeof result.messageId === 'string' ? result.messageId : null;
      notification.sentAt = new Date();
      notification.failureCode = null;
      notification.failureReason = null;

      const savedNotification =
        await this.notificationRepository.save(notification);

      this.logger.log(
        `Notification sent: notificationId=${notification.id}, channel=${notification.channel}`,
      );

      return this.toResponse(savedNotification);
    } catch (error: unknown) {
      notification.status = NotificationStatus.FAILED;
      notification.failureCode = this.extractErrorCode(error);
      notification.failureReason = this.extractErrorMessage(error);

      await this.notificationRepository.save(notification);

      this.logger.error(
        `Notification failed: notificationId=${notification.id}, channel=${notification.channel}`,
      );

      throw new BadGatewayException({
        message: 'The notification provider rejected the message.',
        notificationId: notification.id,
        status: NotificationStatus.FAILED,
      });
    }
  }

  private async findByIdempotencyKey(
    idempotencyKey?: string,
  ): Promise<NotificationEntity | null> {
    if (!idempotencyKey) {
      return null;
    }

    return this.notificationRepository.findOne({
      where: {
        idempotencyKey,
      },
    });
  }

  private toResponse(notification: NotificationEntity): {
    id: string;
    channel: NotificationChannel;
    status: NotificationStatus;
    providerMessageId: string | null;
  } {
    return {
      id: notification.id,
      channel: notification.channel,
      status: notification.status,
      providerMessageId: notification.providerMessageId,
    };
  }

  private asEmailChannelData(
    value: Record<string, unknown> | null,
  ): EmailChannelData {
    if (!value) {
      return {};
    }

    return {
      html: typeof value.html === 'string' ? value.html : undefined,
      cc: this.asStringArray(value.cc),
      bcc: this.asStringArray(value.bcc),
      replyTo: typeof value.replyTo === 'string' ? value.replyTo : undefined,
    };
  }

  private asStringArray(value: unknown): string[] | undefined {
    if (!Array.isArray(value)) {
      return undefined;
    }

    const values = value.filter(
      (item): item is string => typeof item === 'string',
    );

    return values.length > 0 ? values : undefined;
  }

  private removeUndefinedValues(
    value: EmailChannelData,
  ): Record<string, unknown> | null {
    const entries = Object.entries(value).filter(
      ([, entryValue]) => entryValue !== undefined,
    );

    return entries.length > 0 ? Object.fromEntries(entries) : null;
  }

  private extractErrorCode(error: unknown): string | null {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
    ) {
      return error.code;
    }

    return null;
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown notification delivery error';
  }
}
