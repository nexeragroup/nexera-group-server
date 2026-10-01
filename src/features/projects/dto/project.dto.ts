import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    example: 'kubaka',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must contain lowercase letters, numbers, and hyphens only',
  })
  slug!: string;

  @ApiProperty({
    example: 'KB',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  code!: string;

  @ApiProperty({
    example: 'Kubaka',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    example: 'Government',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  category!: string;

  @ApiProperty({
    example: 'A modern digital platform for requesting building permits.',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  headline!: string;

  @ApiProperty({
    example:
      'Kubaka provides a reliable and accessible digital experience for building permit requests.',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  description!: string;

  @ApiProperty({
    type: [String],
    example: [
      '10f930b2-c992-45e5-9e69-25d214b46895',
      '8295d444-9f8c-4755-9014-349e62223b55',
    ],
  })
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(50)
  @IsUUID('4', {
    each: true,
  })
  technologyIds!: string[];

  @ApiPropertyOptional({
    example: 'https://kubaka.gov.rw',
  })
  @IsOptional()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @MaxLength(1000)
  link?: string;

  @ApiPropertyOptional({
    example: 'Visit Kubaka',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  linkLabel?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/projects/kubaka.webp',
  })
  @IsOptional()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @MaxLength(1000)
  imageUrl?: string;

  @ApiPropertyOptional({
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class ProjectQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return value;
  })
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
