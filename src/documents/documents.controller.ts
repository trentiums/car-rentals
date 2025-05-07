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
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { ReviewDocumentDto } from './dto/review-document.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { successResponse } from 'src/common/response.helper';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname, join } from 'path';

const storage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = join(process.cwd(), 'uploads', 'documents');
    cb(null, uploadPath);
  },
  filename: (req, file, callback) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    callback(null, uniqueName);
  },
});

@ApiBearerAuth()
@ApiTags('documents')
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('document', { storage }))
  @ApiOperation({ summary: 'Upload a document for verification' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or validation failed' })
  async uploadDocument(
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }
    const data = await this.service.uploadDocument(req.user.id, dto, file);
    return successResponse(
      data,
      'Document uploaded successfully',
      HttpStatus.CREATED,
    );
  }

  @Get('my-documents')
  @ApiOperation({ summary: 'Get all documents uploaded by the current user' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  async getMyDocuments(@Req() req) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }
    const data = await this.service.getUserDocuments(req.user.id);
    return successResponse(data, 'Documents retrieved successfully');
  }

  @Get('pending')
  @UseGuards(RoleGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all pending documents for admin review' })
  @ApiResponse({
    status: 200,
    description: 'Pending documents retrieved successfully',
  })
  async getPendingDocuments() {
    const data = await this.service.getPendingDocuments();
    return successResponse(data, 'Pending documents retrieved successfully');
  }

  @Put(':id/review')
  @UseGuards(RoleGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Review a document (admin only)' })
  @ApiResponse({ status: 200, description: 'Document reviewed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or validation failed' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async reviewDocument(
    @Param('id') id: string,
    @Body() dto: ReviewDocumentDto,
    @Req() req,
  ) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }
    const data = await this.service.reviewDocument(req.user.id, id, dto);
    return successResponse(data, 'Document reviewed successfully');
  }
}
