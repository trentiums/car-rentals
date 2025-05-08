import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class UploadDocumentDto {
  @ApiProperty({
    enum: DocumentType,
    description: 'Type of document being uploaded',
    example: 'DRIVERS_LICENSE'
  })
  @IsEnum(DocumentType)
  documentType: DocumentType;
}

export class UploadDocumentResponseDto {
  @ApiProperty({
    description: 'ID of the uploaded document',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'Type of the uploaded document',
    enum: DocumentType,
    example: 'DRIVERS_LICENSE'
  })
  documentType: DocumentType;

  @ApiProperty({
    description: 'URL of the uploaded document',
    example: 'https://example.com/documents/123e4567-e89b-12d3-a456-426614174000.pdf'
  })
  documentUrl: string;

  @ApiProperty({
    description: 'Status of the document',
    example: 'PENDING'
  })
  status: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-05-05T12:00:00Z'
  })
  createdAt: Date;
}
