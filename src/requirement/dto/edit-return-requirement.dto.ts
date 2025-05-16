import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsDate,
    IsBoolean,
    IsOptional,
    IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EditReturnRequirementDto {
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

    @ApiPropertyOptional({ type: String, format: 'date-time' })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    returnPickupDate?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    returnPickupTime?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    returnBudget?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    onlyVerified?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    comment?: string;
} 