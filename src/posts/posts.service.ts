import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { S3Service } from 'src/common/s3.service';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { NotificationService } from 'src/common/notification.service';
import { EditPostDto } from './dto/edit-post.dto';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly notificationService: NotificationService,
  ) {
    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'uploads', 'posts');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }
  }

  async createPost(
    userId: string,
    createPostDto: CreatePostDto,
    files: Express.Multer.File[],
  ) {
    const photoData: {
      url: string;
      name: string;
      type: string;
    }[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        // Generate URL for the uploaded file
        const fileUrl = `http://localhost:3001/files/posts/${file.filename}`;

        photoData.push({
          url: fileUrl,
          name: file.originalname,
          type: file.mimetype,
        });
      }
    }

    const post = await this.prisma.post.create({
      data: {
        content: createPostDto.content,
        location: createPostDto.location,
        userId,
        photos: {
          create: photoData,
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

    // Get all users except the post creator
    const users = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        isVerified: true, // Only notify verified users
      },
      select: {
        id: true,
      },
    });

    const userIds = users.map(user => user.id);

    if (userIds.length > 0) {
      // Send notifications to all users
      await this.notificationService.sendBulkPushNotifications(
        userIds,
        'New Post',
        `${post.user.fullName} shared a new post${post.location ? ` from ${post.location}` : ''}`,
        {
          type: 'NEW_POST',
          postId: post.id,
          content: post.content,
          location: post.location,
          hasPhotos: post.photos.length > 0,
          screenName: 'posts',
          postedBy: post.user.fullName
        }
      );
    }

    return post;
  }

  async getPosts(userId: string, page: number = 1, limit: number = 10) {
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
          photos: {
            select: {
              id: true,
              name: true,
              type: true,
              url: true
            },
          },
          likes: {
            where: {
              userId: String(userId),
            },
            select: {
              id: true,
            },
          },
          saves: {
            // Assuming this is the relation for saved posts
            where: {
              userId: String(userId),
            },
            select: {
              id: true,
            },
          },
          _count: {
            select: {
              likes: true,
              shares: true,
            },
          },
        },
      }),
      this.prisma.post.count({
        where: { isActive: true },
      }),
    ]);

    // Add hasLiked and hasSaved flags
    const postsWithStatus = posts.map((post) => ({
      ...post,
      hasLiked: post.likes.length > 0,
      hasSaved: post.saves.length > 0,
    }));

    return {
      posts: postsWithStatus,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPostById(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
        photos: {
          select: {
            id: true,
            name: true,
            type: true,
            url: true
          },
        },
        likes: {
          where: {
            userId: String(userId),
          },
          select: {
            id: true,
          },
        },
        saves: {
          where: {
            userId: String(userId),
          },
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            likes: true,
            shares: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not founds');
    }

    return {
      ...post, hasLiked: post.likes.length > 0,
      hasSaved: post.saves.length > 0,
    };
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

  async getSavedPosts(userId: string) {
    const saves = await this.prisma.save.findMany({
      where: { userId },
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
            photos: {
              select: {
                id: true,
                name: true,
                type: true,
                url: true
              },
            },
            likes: {
              where: {
                userId: String(userId),
              },
              select: {
                id: true,
              },
            },
            saves: {
              where: {
                userId: String(userId),
              },
              select: {
                id: true,
              },
            },
            _count: {
              select: {
                likes: true,
                shares: true,
                saves: true
              },
            },
          },
        },
      },
    });

    return {
      posts: saves.map((save) => save.post),
      total: saves.length,
    };
  }

  async editPost(
    dto: EditPostDto,
    userId: string,
    files?: Express.Multer.File[],
    existingPhotoIds?: string[] | string
  ) {
    console.log(existingPhotoIds, 'existingPhotoIds');

    const post = await this.prisma.post.findUnique({
      where: { id: dto.id },
      include: {
        user: {
          select: { id: true, fullName: true },
        },
        photos: {
          select: { id: true, name: true, type: true, url: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new BadRequestException('You can only edit your own posts');
    }

    // ✅ Normalize existingPhotoIds to an array of strings (UUIDs)
    let idsToKeep: string[] = [];

    if (Array.isArray(existingPhotoIds)) {
      if (existingPhotoIds.length === 1 && typeof existingPhotoIds[0] === 'string') {
        try {
          idsToKeep = JSON.parse(existingPhotoIds[0]);
        } catch (err) {
          console.error('Failed to parse existingPhotoIds[0]', err);
        }
      } else {
        idsToKeep = existingPhotoIds;
      }
    } else if (typeof existingPhotoIds === 'string') {
      try {
        idsToKeep = JSON.parse(existingPhotoIds);
      } catch (err) {
        console.error('Failed to parse existingPhotoIds', err);
        idsToKeep = [existingPhotoIds];
      }
    }

    console.log(idsToKeep, 'idsToKeep');

    // ✅ Delete photos that are NOT in existingPhotoIds
    await this.prisma.postPhoto.deleteMany({
      where: {
        postId: dto.id,
        ...(idsToKeep.length > 0 && {
          id: {
            notIn: idsToKeep,
          },
        }),
      },
    });

    // ✅ Prepare new photos data
    const photoData: {
      url: string;
      name: string;
      type: string;
    }[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const fileUrl = `http://localhost:3001/files/posts/${file.filename}`;
        photoData.push({
          url: fileUrl,
          name: file.originalname,
          type: file.mimetype,
        });
      }
    }

    // ✅ Update post with new data and photos
    const updatedPost = await this.prisma.post.update({
      where: { id: dto.id },
      data: {
        content: dto.content,
        location: dto.location,
        ...(photoData.length > 0 && {
          photos: {
            create: photoData,
          },
        }),
      },
      include: {
        user: { select: { id: true, fullName: true } },
        photos: { select: { id: true, name: true, type: true, url: true } },
        likes: {
          where: { userId: String(userId) },
          select: { id: true },
        },
        saves: {
          where: { userId: String(userId) },
          select: { id: true },
        },
        _count: {
          select: { likes: true, shares: true },
        },
      },
    });

    return {
      ...updatedPost,
      hasLiked: updatedPost.likes.length > 0,
      hasSaved: updatedPost.saves.length > 0,
    };
  }


}
