import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DocumentStatus } from '@prisma/client';

export class ReviewDocumentDto {
    @ApiProperty({ enum: DocumentStatus, description: 'New status for the document' })
    @IsEnum(DocumentStatus)
    status: DocumentStatus;

    @ApiPropertyOptional({ description: 'Reason for rejection if status is REJECTED' })
    @IsOptional()
    @IsString()
    rejectionReason?: string;
} 