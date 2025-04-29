import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { S3Service } from 'src/common/s3.service';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async createPost(userId: string, createPostDto: CreatePostDto, files: any[]) {
    const photoUrls: { url: string }[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const photoUrl = await this.s3Service.uploadFile(file, 'posts');
        photoUrls.push({ url: photoUrl });
      }
    }

    return this.prisma.post.create({
      data: {
        content: createPostDto.content,
        location: createPostDto.location,
        userId,
        photos: {
          create: photoUrls,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
        photos: true,
      },
    });
  }

  async getPosts(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        skip,
        take: limit,
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
          photos: true,
        },
      }),
      this.prisma.post.count({
        where: { isActive: true },
      }),
    ]);

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPostById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
        photos: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async deletePost(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { photos: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new NotFoundException('You can only delete your own posts');
    }

    if (post.photos && post.photos.length > 0) {
      for (const photo of post.photos) {
        // Delete photos from S3 if needed
      }
    }

    return this.prisma.post.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async likePost(postId: string, userId: string) {
    const existingLike = await this.prisma.like.findUnique({
      where: {
        postId_userId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      return this.prisma.like.delete({
        where: {
          postId_userId: {
            userId,
            postId,
          },
        },
      });
    }

    return this.prisma.like.create({
      data: {
        userId,
        postId,
      },
    });
  }

  async sharePost(postId: string, userId: string) {
    return this.prisma.share.create({
      data: {
        userId,
        postId,
      },
    });
  }

  async savePost(postId: string, userId: string) {
    const existingSave = await this.prisma.save.findUnique({
      where: {
        postId_userId: {
          userId,
          postId,
        },
      },
    });

    if (existingSave) {
      return this.prisma.save.delete({
        where: {
          postId_userId: {
            userId,
            postId,
          },
        },
      });
    }

    return this.prisma.save.create({
      data: {
        userId,
        postId,
      },
    });
  }

  async getPostsByUser(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { userId, isActive: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
          photos: true,
        },
      }),
      this.prisma.post.count({
        where: { userId, isActive: true },
      }),
    ]);

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSavedPosts(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [saves, total] = await Promise.all([
      this.prisma.save.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          post: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
              photos: true,
            },
          },
        },
      }),
      this.prisma.save.count({
        where: { userId },
      }),
    ]);

    return {
      posts: saves.map((save) => save.post),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
