import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserProfileDto, UserStatsDto } from './dto/user-profile.dto';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async getUserProfile(userId: string): Promise<UserProfileDto> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Get user statistics
        const [
            totalTrips,
            activeTrips,
            completedTrips,
            totalPosts,
            activePosts,
            totalDocuments,
            approvedDocuments,
            rejectedDocuments,
        ] = await Promise.all([
            // Total trips count
            this.prisma.requirement.count({
                where: { postedById: userId },
            }),
            // Active trips count
            this.prisma.requirement.count({
                where: {
                    postedById: userId,
                    status: 'CREATED',
                },
            }),
            // Completed trips count
            this.prisma.requirement.count({
                where: {
                    postedById: userId,
                    status: 'CONFIRMED',
                },
            }),
            // Total posts count
            this.prisma.post.count({
                where: { userId },
            }),
            // Active posts count
            this.prisma.post.count({
                where: {
                    userId,
                    isActive: true,
                },
            }),
            // Total documents count
            this.prisma.userDocument.count({
                where: { userId },
            }),
            // Approved documents count
            this.prisma.userDocument.count({
                where: {
                    userId,
                    status: 'APPROVED',
                },
            }),
            // Rejected documents count
            this.prisma.userDocument.count({
                where: {
                    userId,
                    status: 'REJECTED',
                },
            }),
        ]);

        const stats: UserStatsDto = {
            totalTrips,
            activeTrips,
            completedTrips,
            totalPosts,
            activePosts,
            totalDocuments,
            approvedDocuments,
            rejectedDocuments,
        };

        // Map the Prisma response to our DTO
        const userProfile: UserProfileDto = {
            id: user.id,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            email: user.email,
            businessName: user.businessName,
            businessDescription: user.businessDescription,
            city: user.city,
            state: user.state,
            pinCode: user.pinCode,
            isVerified: user.isVerified,
            role: user.role,
            stats,
            createdAt: user.createdAt,
        };

        return userProfile;
    }
} 