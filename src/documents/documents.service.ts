import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { ReviewDocumentDto } from './dto/review-document.dto';
import { DocumentStatus, DocumentType } from '@prisma/client';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {
    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'uploads', 'documents');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }
  }

  async uploadDocument(
    userId: string,
    dto: UploadDocumentDto,
    file: Express.Multer.File,
  ) {
    // Generate URL for the uploaded file
    const fileUrl = `http://localhost:3001/files/documents/${file.filename}`;

    return this.prisma.userDocument.create({
      data: {
        userId,
        documentType: dto.documentType,
        documentUrl: fileUrl,
        status: 'PENDING',
      },
    });
  }

  async getUserDocuments(userId: string) {
    return this.prisma.userDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingDocuments() {
    return this.prisma.userDocument.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,

          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewDocument(
    adminId: string,
    documentId: string,
    dto: ReviewDocumentDto,
  ) {
    const document = await this.prisma.userDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return this.prisma.userDocument.update({
      where: { id: documentId },
      data: {
        status: dto.status,
        rejectionReason: dto.rejectionReason,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });
  }

  private async checkAndUpdateUserVerification(userId: string) {
    // Get all documents for the user
    const documents = await this.prisma.userDocument.findMany({
      where: { userId },
    });

    // Check if all required documents are approved
    const requiredDocumentTypes = [
      DocumentType.AADHAR_FRONT,
      DocumentType.AADHAR_BACK,
      DocumentType.DRIVING_LICENSE_FRONT,
      DocumentType.DRIVING_LICENSE_BACK,
    ];

    const allDocumentsApproved = requiredDocumentTypes.every((docType) => {
      const doc = documents.find((d) => d.documentType === docType);
      return doc && doc.status === 'APPROVED';
    });

    // If all documents are approved, update user verification status
    if (allDocumentsApproved) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isVerified: true },
      });
    }
  }
}
