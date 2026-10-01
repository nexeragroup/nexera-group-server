import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { NotificationStatus } from '../enums/notification-status.enum';

@Entity({ name: 'notifications' })
@Index('IDX_notifications_channel', ['channel'])
@Index('IDX_notifications_status', ['status'])
@Index('IDX_notifications_recipient', ['recipient'])
@Index('IDX_notifications_created_at', ['createdAt'])
@Index('IDX_notifications_source_service', ['sourceService'])
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Prevents the same notification from being created multiple times.
   */
  @Index('UQ_notifications_idempotency_key', {
    unique: true,
    where: '"idempotencyKey" IS NOT NULL',
  })
  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  idempotencyKey!: string | null;

  /**
   * Determines how this notification is delivered.
   *
   * Examples:
   * EMAIL, SMS, WHATSAPP, PUSH or IN_APP.
   */
  @Column({
    type: 'enum',
    enum: NotificationChannel,
  })
  channel!: NotificationChannel;

  /**
   * Delivery destination.
   *
   * EMAIL: email address
   * SMS: telephone number
   * WHATSAPP: telephone number
   * PUSH: device token
   * IN_APP: user ID
   */
  @Column({
    type: 'varchar',
    length: 500,
  })
  recipient!: string;

  /**
   * Optional display title.
   *
   * EMAIL: subject
   * PUSH: notification title
   * SMS: usually null
   */
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  title!: string | null;

  /**
   * Main human-readable notification content.
   *
   * EMAIL: plain-text body
   * SMS: message
   * WHATSAPP: message
   * PUSH: notification message
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  body!: string | null;

  /**
   * Channel-specific data.
   *
   * EMAIL example:
   * {
   *   "html": "<h1>Hello</h1>",
   *   "cc": ["person@example.com"],
   *   "bcc": [],
   *   "replyTo": "support@example.com"
   * }
   *
   * PUSH example:
   * {
   *   "imageUrl": "...",
   *   "route": "/orders/123"
   * }
   */
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  channelData!: Record<string, unknown> | null;

  /**
   * Optional template name used to generate the notification.
   *
   * Examples:
   * welcome-email
   * password-reset
   * payment-receipt
   */
  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  templateName!: string | null;

  /**
   * Values supplied to the notification template.
   */
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  templateData!: Record<string, unknown> | null;

  /**
   * Service that requested this notification.
   *
   * Examples:
   * nexera-pos
   * nexera-auth
   * nexera-client
   */
  @Column({
    type: 'varchar',
    length: 100,
    default: 'unknown',
  })
  sourceService!: string;

  /**
   * User, scheduled task or system process that requested it.
   */
  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  requestedBy!: string | null;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status!: NotificationStatus;

  /**
   * Provider used for delivery.
   *
   * Examples:
   * SMTP
   * Twilio
   * Firebase
   * Meta
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  provider!: string | null;

  /**
   * Identifier returned by the external provider.
   */
  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  providerMessageId!: string | null;

  /**
   * Number of delivery attempts made for this notification.
   */
  @Column({
    type: 'integer',
    default: 0,
  })
  attemptCount!: number;

  /**
   * When the latest delivery attempt started.
   */
  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  lastAttemptAt!: Date | null;

  /**
   * Latest provider or transport error code.
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  failureCode!: string | null;

  /**
   * Latest delivery failure description.
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  failureReason!: string | null;

  /**
   * Time the provider accepted the notification.
   */
  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  sentAt!: Date | null;

  /**
   * Additional non-channel-specific audit information.
   */
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updatedAt!: Date;
}
