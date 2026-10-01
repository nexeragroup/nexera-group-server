import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  GATEWAY_CORRELATION_ID_MAX_LENGTH,
  GATEWAY_CORRELATION_ID_PATTERN,
  GATEWAY_OPERATION_MAX_LENGTH,
  GATEWAY_OPERATION_PATTERN,
} from '../constants/gateway.constants';
import { GatewayName } from '../enums/gateway-name.enum';

export class GatewayResponseMetadataDto {
  @ApiProperty({
    enum: GatewayName,
  })
  @IsEnum(GatewayName)
  gateway!: GatewayName;

  @ApiProperty({
    example: 'sale.create',
  })
  @IsString()
  @MaxLength(GATEWAY_OPERATION_MAX_LENGTH)
  @Matches(GATEWAY_OPERATION_PATTERN)
  operation!: string;

  @ApiProperty({
    example: 200,
  })
  @IsInt()
  @Min(100)
  @Max(599)
  statusCode!: number;

  @ApiProperty({
    example: 42.35,
  })
  @IsNumber()
  @Min(0)
  durationMs!: number;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(GATEWAY_CORRELATION_ID_MAX_LENGTH)
  @Matches(GATEWAY_CORRELATION_ID_PATTERN)
  requestId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(GATEWAY_CORRELATION_ID_MAX_LENGTH)
  @Matches(GATEWAY_CORRELATION_ID_PATTERN)
  traceId?: string | null;

  @ApiProperty({
    example: '2026-09-16T20:00:00.000Z',
  })
  @IsISO8601()
  receivedAt!: string;
}

export class GatewayResponseDto {
  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  success!: true;

  /**
   * Provider-specific response data.
   *
   * Actual provider clients should strongly type this at compile
   * time rather than relying solely on this generic DTO.
   */
  @ApiProperty({
    nullable: true,
    additionalProperties: true,
  })
  data!: unknown;

  @ApiProperty({
    type: GatewayResponseMetadataDto,
  })
  @ValidateNested()
  @Type(() => GatewayResponseMetadataDto)
  metadata!: GatewayResponseMetadataDto;
}
