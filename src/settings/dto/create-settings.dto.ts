import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSettingsDto {
  @ApiProperty({ description: 'Unique key for the setting' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: 'Value of the setting' })
  @IsNotEmpty()
  value: any;

  @ApiProperty({ description: 'Type of the setting' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Description of the setting' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Whether the setting is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Additional metadata for the setting',
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
