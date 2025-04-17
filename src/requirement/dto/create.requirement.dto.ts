import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsDate, IsBoolean, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export enum TripTypeEnum {
  ROUND = 'ROUND',
  ONEWAY = 'ONEWAY',
}

export class CreateRequirementDto {
  @ApiProperty()
  @IsString()
  fromCity: string;

  @ApiProperty()
  @IsString()
  toCity: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDate()
  @Type(() => Date)
  pickupDate: Date;

  @ApiProperty()
  @IsString()
  pickupTime: string;

  @ApiProperty()
  @IsString()
  carType: string;

  @ApiProperty({ enum: TripTypeEnum, enumName: 'TripTypeEnum' })
  @IsEnum(TripTypeEnum, {
    message: 'tripType must be either ROUND or ONEWAY',
  })
  tripType: TripTypeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  budget?: number;

  @ApiProperty()
  @IsBoolean()
  onlyVerified: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}
