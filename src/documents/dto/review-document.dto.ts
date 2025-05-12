import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentStatus } from '@prisma/client';

export class ReviewDocumentDto {
    @ApiProperty({
        enum: DocumentStatus,
        description: 'Document status (APPROVED or REJECTED)',
        example: DocumentStatus.APPROVED,
    })
    @IsEnum(DocumentStatus)
    status: DocumentStatus;

    @ApiProperty({
        description: 'Reason for rejection (required only if status is REJECTED)',
        example: 'Document is blurry',
        required: false,
    })
    @IsOptional()
    @IsString()
    rejectionReason?: string;
} 