import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { ReviewDocumentDto } from './dto/review-document.dto';
import { DocumentStatus, DocumentType } from '@prisma/client';

@Injectable()
export class DocumentsService {
    constructor(private readonly prisma: PrismaService) { }

    async uploadDocument(userId: string, dto: UploadDocumentDto) {
        // Check if user exists
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check if document of this type already exists
        const existingDocument = await this.prisma.userDocument.findFirst({
            where: {
                userId,
                documentType: dto.documentType,
                status: {
                    not: 'REJECTED',
                },
            },
        });

        if (existingDocument) {
            throw new BadRequestException(`Document of type ${dto.documentType} already exists`);
        }

        // Create the document record
        return this.prisma.userDocument.create({
            data: {
                userId,
                documentType: dto.documentType,
                documentUrl: dto.documentUrl,
                status: 'PENDING',
            },
        });
    }

    async reviewDocument(adminId: string, documentId: string, dto: ReviewDocumentDto) {
        // Check if admin exists
        const admin = await this.prisma.user.findUnique({
            where: { id: adminId },
        });

        if (!admin || admin.role !== 'ADMIN') {
            throw new BadRequestException('Only admins can review documents');
        }

        // Check if document exists
        const document = await this.prisma.userDocument.findUnique({
            where: { id: documentId },
            include: {
                user: true,
            },
        });

        if (!document) {
            throw new NotFoundException('Document not found');
        }

        // Update document status
        const updatedDocument = await this.prisma.userDocument.update({
            where: { id: documentId },
            data: {
                status: dto.status,
                rejectionReason: dto.status === 'REJECTED' ? dto.rejectionReason : null,
                reviewedBy: adminId,
                reviewedAt: new Date(),
            },
        });

        // If document is approved, check if all required documents are approved
        if (dto.status === 'APPROVED') {
            await this.checkAndUpdateUserVerification(document.userId);
        }

        return updatedDocument;
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
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
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