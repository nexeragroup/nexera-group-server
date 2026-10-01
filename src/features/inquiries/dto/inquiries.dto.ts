import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class NewInquiry {
  @IsString()
  @Length(2, 120)
  names!: string;

  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  company?: string;

  @IsString()
  @Length(2, 120)
  service!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  budget?: string;

  @IsString()
  @Length(10, 5_000)
  projectDetails!: string;
}
