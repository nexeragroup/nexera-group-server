import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  GATEWAY_CORRELATION_ID_MAX_LENGTH,
  GATEWAY_CORRELATION_ID_PATTERN,
  GATEWAY_IDEMPOTENCY_KEY_MAX_LENGTH,
  GATEWAY_IDEMPOTENCY_KEY_PATTERN,
  GATEWAY_MAX_TIMEOUT_MS,
  GATEWAY_MIN_TIMEOUT_MS,
  GATEWAY_OPERATION_MAX_LENGTH,
  GATEWAY_OPERATION_PATTERN,
  GATEWAY_PATH_MAX_LENGTH,
  GATEWAY_PATH_PATTERN,
} from '../constants/gateway.constants';
import { GatewayName } from '../enums/gateway-name.enum';
import type { GatewayHttpMethod } from '../interfaces/gateway-request.interface';
const GATEWAY_HTTP_METHODS: readonly GatewayHttpMethod[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
];

export class GatewayRequestDto {
  @ApiProperty({
    enum: GatewayName,
  })
  @IsEnum(GatewayName)
  gateway!: GatewayName;

  @ApiProperty({
    example: 'sale.create',
    maxLength: GATEWAY_OPERATION_MAX_LENGTH,
  })
  @IsString()
  @MaxLength(GATEWAY_OPERATION_MAX_LENGTH)
  @Matches(GATEWAY_OPERATION_PATTERN, {
    message: 'Gateway operation contains invalid characters',
  })
  operation!: string;

  @ApiProperty({
    enum: GATEWAY_HTTP_METHODS,
    example: 'POST',
  })
  @IsString()
  @IsIn(GATEWAY_HTTP_METHODS)
  method!: GatewayHttpMethod;

  @ApiProperty({
    example: '/api/v1/sales',
    maxLength: GATEWAY_PATH_MAX_LENGTH,
  })
  @IsString()
  @MaxLength(GATEWAY_PATH_MAX_LENGTH)
  @Matches(GATEWAY_PATH_PATTERN, {
    message: 'Gateway path must be a relative application path',
  })
  path!: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  query?: Record<string, unknown>;

  @ApiPropertyOptional({
    maxLength: GATEWAY_CORRELATION_ID_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(GATEWAY_CORRELATION_ID_MAX_LENGTH)
  @Matches(GATEWAY_CORRELATION_ID_PATTERN)
  requestId?: string;

  @ApiPropertyOptional({
    maxLength: GATEWAY_CORRELATION_ID_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(GATEWAY_CORRELATION_ID_MAX_LENGTH)
  @Matches(GATEWAY_CORRELATION_ID_PATTERN)
  traceId?: string;

  @ApiPropertyOptional({
    maxLength: GATEWAY_IDEMPOTENCY_KEY_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(GATEWAY_IDEMPOTENCY_KEY_MAX_LENGTH)
  @Matches(GATEWAY_IDEMPOTENCY_KEY_PATTERN)
  idempotencyKey?: string;

  @ApiPropertyOptional({
    minimum: GATEWAY_MIN_TIMEOUT_MS,

    maximum: GATEWAY_MAX_TIMEOUT_MS,

    example: 10_000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(GATEWAY_MIN_TIMEOUT_MS)
  @Max(GATEWAY_MAX_TIMEOUT_MS)
  timeoutMs?: number;
}
