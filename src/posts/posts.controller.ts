import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Delete,
  Param,
  UnauthorizedException,
  UseInterceptors,
  UploadedFiles,
  Query,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiBearerAuth()
@ApiTags('posts')
@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('photos', 10))
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  createPost(
    @Req() req,
    @Body() createPostDto: CreatePostDto,
    @UploadedFiles() files: any[],
  ) {
    return this.postsService.createPost(req.user.id, createPostDto, files);
  }

  @Get()
  @ApiOperation({ summary: 'Get all posts' })
  @ApiResponse({ status: 200, description: 'Return all posts' })
  getPosts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.postsService.getPosts(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a post by id' })
  @ApiResponse({ status: 200, description: 'Return the post' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  getPostById(@Param('id') id: string) {
    return this.postsService.getPostById(id);
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
  likePost(@Param('id') id: string, @Req() req) {
    return this.postsService.likePost(id, req.user.id);
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Share a post' })
  @ApiResponse({ status: 200, description: 'Post shared successfully' })
  sharePost(@Param('id') id: string, @Req() req) {
    return this.postsService.sharePost(id, req.user.id);
  }

  @Post(':id/save')
  @ApiOperation({ summary: 'Save or unsave a post' })
  @ApiResponse({ status: 200, description: 'Post saved/unsaved successfully' })
  savePost(@Param('id') id: string, @Req() req) {
    return this.postsService.savePost(id, req.user.id);
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
