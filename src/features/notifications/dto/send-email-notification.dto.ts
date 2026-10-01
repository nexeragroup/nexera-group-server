import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class SendEmailNotificationDto {
  @IsEmail()
  @MaxLength(320)
  to!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsEmail({}, { each: true })
  cc?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsEmail({}, { each: true })
  bcc?: string[];

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  replyTo?: string;

  @IsString()
  @Length(1, 255)
  subject!: string;

  @ValidateIf((request: SendEmailNotificationDto) => !request.html)
  @IsString()
  @MaxLength(200_000)
  text?: string;

  @ValidateIf((request: SendEmailNotificationDto) => !request.text)
  @IsString()
  @MaxLength(500_000)
  html?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  templateName?: string;

  @IsOptional()
  @IsObject()
  templateData?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  idempotencyKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceService?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  requestedBy?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
