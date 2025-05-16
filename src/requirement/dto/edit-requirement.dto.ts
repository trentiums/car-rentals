import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsDate,
    IsBoolean,
    IsOptional,
    IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EditRequirementDto {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    fromCity?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    toCity?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    carType?: string;

    @ApiPropertyOptional({ type: String, format: 'date-time' })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    pickupDate?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    pickupTime?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    budget?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    tripType?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    onlyVerified?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    comment?: string;
} 