import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class UploadDocumentDto {
    @ApiProperty({ enum: DocumentType, description: 'Type of document being uploaded' })
    @IsEnum(DocumentType)
    documentType: DocumentType;

    @ApiProperty({ description: 'Base64 encoded document image or URL to the document' })
    @IsString()
    documentUrl: string;
} 