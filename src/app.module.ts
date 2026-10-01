import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import corsConfig from './config/cors.config';
import gatewayConfig from './config/gateway.config';
import cryptoConfig from './config/crypto.config';
import securityConfig from './config/security.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import cacheConfig from './config/cache.config';
import queueConfig from './config/queue.config';
import outboxConfig from './config/outbox.config';
import storageConfig from './config/storage.config';
import { validationSchema } from './config/validation';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { MailsModule } from './modules/mails/mails.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { HealthModule } from './modules/health/health.module';
import { BackupsModule } from './modules/backups/backups.module';
import { CryptoModule } from './modules/crypto/crypto.module';
import { InquiriesModule } from './features/inquiries/inquiries.module';
import { NotificationsModule } from './features/notifications/notifications.module';
import { ProjectsModule } from './features/projects/projects.module';
import { TechnologiesModule } from './features/technologies/technologies.module';

const environmentFileNames: Record<string, string> = {
  development: 'dev',
  staging: 'staging',
  production: 'prod',
};

const environment = process.env.NODE_ENV ?? 'development';
const environmentFile = environmentFileNames[environment] ?? environment;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${environmentFile}`, '.env'],
      load: [
        appConfig,
        authConfig,
        corsConfig,
        gatewayConfig,
        cryptoConfig,
        securityConfig,
        databaseConfig,
        redisConfig,
        cacheConfig,
        queueConfig,
        outboxConfig,
        storageConfig,
      ],
      validationSchema,
    }),
    CommonModule,
    CryptoModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    AuditLogsModule,
    MailsModule,
    RolesModule,
    PermissionsModule,
    HealthModule,
    BackupsModule,

    NotificationsModule,
    InquiriesModule,
    ProjectsModule,
    TechnologiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
