import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class UploadDocumentDto {
  @ApiProperty({
    enum: DocumentType,
    description: 'Type of document being uploaded',
  })
  @IsEnum(DocumentType)
  documentType: DocumentType;
}
