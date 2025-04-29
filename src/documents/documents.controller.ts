import {
    Controller,
    Post,
    Body,
    Req,
    UseGuards,
    Get,
    Param,
    Put,
    UnauthorizedException,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { ReviewDocumentDto } from './dto/review-document.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiBearerAuth()
@ApiTags('documents')
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
    constructor(private readonly service: DocumentsService) { }

    @Post('upload')
    @ApiOperation({ summary: 'Upload a document for verification' })
    @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
    @ApiResponse({ status: 400, description: 'Bad request or validation failed' })
    uploadDocument(@Body() dto: UploadDocumentDto, @Req() req) {
        if (!req.user.id) {
            throw new UnauthorizedException('User not logged in');
        }
        return this.service.uploadDocument(req.user.id, dto);
    }

    @Get('my-documents')
    @ApiOperation({ summary: 'Get all documents uploaded by the current user' })
    @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
    getMyDocuments(@Req() req) {
        if (!req.user.id) {
            throw new UnauthorizedException('User not logged in');
        }
        return this.service.getUserDocuments(req.user.id);
    }

    @Get('pending')
    @UseGuards(RoleGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Get all pending documents for admin review' })
    @ApiResponse({ status: 200, description: 'Pending documents retrieved successfully' })
    getPendingDocuments() {
        return this.service.getPendingDocuments();
    }

    @Put(':id/review')
    @UseGuards(RoleGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Review a document (admin only)' })
    @ApiResponse({ status: 200, description: 'Document reviewed successfully' })
    @ApiResponse({ status: 400, description: 'Bad request or validation failed' })
    @ApiResponse({ status: 404, description: 'Document not found' })
    reviewDocument(@Param('id') id: string, @Body() dto: ReviewDocumentDto, @Req() req) {
        if (!req.user.id) {
            throw new UnauthorizedException('User not logged in');
        }
        return this.service.reviewDocument(req.user.id, id, dto);
    }
} 