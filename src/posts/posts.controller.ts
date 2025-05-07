import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { successResponse } from 'src/common/response.helper';


const storage = diskStorage({
  destination: './uploads/posts',
  filename: (req, file, callback) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    callback(null, uniqueName);
  },
});

@ApiBearerAuth()
@ApiTags('posts')
@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @Post()
  @UseInterceptors(FilesInterceptor('photos', 10, { storage }))
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  createPost(
    @Req() req,
    @Body() createPostDto: CreatePostDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.postsService.createPost(req.user.id, createPostDto, files);
  }

  @Get()
  @ApiOperation({ summary: 'Get all posts' })
  @ApiResponse({ status: 200, description: 'Return all posts' })
  getPosts(
    @Req() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.postsService.getPosts(req.user.id, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a post by id' })
  @ApiResponse({ status: 200, description: 'Return the post' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  getPostById(@Param('id') id: string) {
    const result = this.postsService.getPostById(id);
    return successResponse(result, `post with id ${id} get successfully`)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  deletePost(@Param('id') id: string, @Req() req) {
    return this.postsService.deletePost(id, req.user.id);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Like or unlike a post' })
  @ApiResponse({ status: 200, description: 'Post liked/unliked successfully' })
  async likePost(@Param('id') id: string, @Req() req) {
    const result = await this.postsService.likePost(id, req.user.id);
    return successResponse(result, 'Post liked/unliked successfully');
  }


  @Post(':id/share')
  @ApiOperation({ summary: 'Share a post' })
  @ApiResponse({ status: 200, description: 'Post shared successfully' })
  async sharePost(@Param('id') id: string, @Req() req) {
    const result = await this.postsService.sharePost(id, req.user.id);
    return successResponse(result, 'Post shared successfully');
  }

  @Post(':id/save')
  @ApiOperation({ summary: 'Save or unsave a post' })
  @ApiResponse({ status: 200, description: 'Post saved/unsaved successfully' })
  async savePost(@Param('id') id: string, @Req() req) {
    const result = await this.postsService.savePost(id, req.user.id);
    return successResponse(result, 'Post save/unsave updated successfully');
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get posts by user' })
  @ApiResponse({ status: 200, description: 'Return user posts' })
  getPostsByUser(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.postsService.getPostsByUser(userId, page, limit);
  }

  @Get('saved')
  @ApiOperation({ summary: 'Get saved posts' })
  @ApiResponse({ status: 200, description: 'Return saved posts' })
  getSavedPosts(
    @Req() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.postsService.getSavedPosts(req.user.id, page, limit);
  }
}
