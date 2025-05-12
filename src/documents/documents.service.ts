import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { ReviewDocumentDto } from './dto/review-document.dto';
import { DocumentStatus } from '@prisma/client';
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
    // Check if there's an existing rejected document of the same type
    const existingDocument = await this.prisma.userDocument.findFirst({
      where: {
        userId,
        documentType: dto.documentType,
        status: 'REJECTED',
      },
    });

    // Generate URL for the uploaded file
    const fileUrl = `http://localhost:3001/files/documents/${file.filename}`;

    if (existingDocument) {
      // Update the existing rejected document
      return this.prisma.userDocument.update({
        where: { id: existingDocument.id },
        data: {
          documentUrl: fileUrl,
          status: 'PENDING',
          rejectionReason: null,
          reviewedBy: null,
          reviewedAt: null,
        },
      });
    }

    // Create new document if no rejected document exists
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

  async getPendingDocuments(page: number, pageSize: number, search: string, status: string) {
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Build search filter for fullName if search query is provided
    const searchFilter = search ? {
      fullName: {
        contains: search,
      },
    } : {};

    // If status is provided, get documents with that specific status
    if (status) {
      const documents = await this.prisma.user.findMany({
        where: {
          documents: {
            some: { status: status as DocumentStatus },
          },
          ...searchFilter,
        },
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          documents: {
            where: { status: status as DocumentStatus },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      });

      const totalCount = await this.prisma.user.count({
        where: {
          documents: {
            some: { status: status as DocumentStatus },
          },
          ...searchFilter,
        },
      });

      return {
        data: documents,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: page,
      };
    }

    // If no status provided, get a mix of documents with different statuses
    const documents = await this.prisma.user.findMany({
      where: {
        documents: {
          some: {},
        },
        ...searchFilter,
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });

    const totalCount = await this.prisma.user.count({
      where: {
        documents: {
          some: {},
        },
        ...searchFilter,
      },
    });

    // Randomize the order of documents for each user
    const randomizedDocuments = documents.map(user => ({
      ...user,
      documents: user.documents.sort(() => Math.random() - 0.5),
    }));

    return {
      data: randomizedDocuments,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
    };
  }

  async reviewDocument(
    AdminId: string,
    documentId: string,
    dto: ReviewDocumentDto,
  ) {
    const document = await this.prisma.userDocument.findUnique({
      where: { id: documentId },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (dto.status === DocumentStatus.APPROVED) {
      const updated = await this.prisma.userDocument.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.APPROVED,
          reviewedBy: AdminId,
          reviewedAt: new Date(),
        },
      });

      // Count approved documents for the user
      const approvedDocumentsCount = await this.prisma.userDocument.count({
        where: {
          userId: document.userId,
          status: DocumentStatus.APPROVED,
        },
      });

      // Update user verification status if they have 2 or more approved documents
      if (approvedDocumentsCount >= 2) {
        await this.prisma.user.update({
          where: { id: document.userId },
          data: { isVerified: true },
        });
      }

      return {
        message: 'Document approved successfully',
        document: updated,
        isUserVerified: approvedDocumentsCount >= 2,
      };
    }

    if (dto.status === DocumentStatus.REJECTED) {
      if (!dto.rejectionReason) {
        throw new BadRequestException('Rejection reason is required when rejecting documents');
      }

      const updated = await this.prisma.userDocument.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.REJECTED,
          rejectionReason: dto.rejectionReason,
          reviewedBy: AdminId,
          reviewedAt: new Date(),
        },
      });

      // Count approved documents for the user
      const approvedDocumentsCount = await this.prisma.userDocument.count({
        where: {
          userId: document.userId,
          status: DocumentStatus.APPROVED,
        },
      });

      // Update user verification status to false if they have less than 2 approved documents
      if (approvedDocumentsCount < 2) {
        await this.prisma.user.update({
          where: { id: document.userId },
          data: { isVerified: false },
        });
      }

      return {
        message: 'Document rejected successfully',
        document: updated,
        rejectionReason: dto.rejectionReason,
        isUserVerified: approvedDocumentsCount >= 2,
      };
    }

    throw new BadRequestException('Invalid status provided');
  }
}
