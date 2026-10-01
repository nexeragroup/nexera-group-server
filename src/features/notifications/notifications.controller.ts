import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { NotificationsService } from './notifications.service';
import { SendEmailNotificationDto } from './dto/send-email-notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Creates and sends an email notification.
   */
  @Post('email')
  @HttpCode(HttpStatus.OK)
  @Permissions('NOTIFICATIONS.CREATE')
  sendEmail(
    @Body() body: SendEmailNotificationDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.notificationsService.sendEmail({
      ...body,
      requestedBy: userId,
    });
  }

  /**
   * Returns a notification audit record.
   */
  @Get(':id')
  @Permissions('NOTIFICATIONS.READ')
  findOne(@Param('id', new ParseUUIDPipe()) notificationId: string) {
    return this.notificationsService.findOne(notificationId);
  }

  /**
   * Retries a failed email notification.
   */
  @Post(':id/retry')
  @HttpCode(HttpStatus.OK)
  @Permissions('NOTIFICATIONS.RETRY')
  retry(@Param('id', new ParseUUIDPipe()) notificationId: string) {
    return this.notificationsService.retryEmail(notificationId);
  }
}
