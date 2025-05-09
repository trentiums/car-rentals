import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role, RentalStatus } from '@prisma/client';

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) { }

    async getDashboardStats() {
        const [
            totalUsers,
            activeUsers,
            blockedUsers,
            pendingDocuments,
            totalRentals,
            activeRentals,
            totalRevenue,
        ] = await Promise.all([
            // Total users count
            this.prisma.user.count(),

            // Active users count (using isVerified instead of status)
            this.prisma.user.count({
                where: { isVerified: true },
            }),

            // Blocked users count (using isVerified instead of status)
            this.prisma.user.count({
                where: { isVerified: false },
            }),

            // Pending documents count
            this.prisma.userDocument.count({
                where: { status: 'PENDING' },
            }),

            // Total rentals count
            this.prisma.rental.count(),

            // Active rentals count
            this.prisma.rental.count({
                where: { status: RentalStatus.ACTIVE },
            }),

            // Total revenue (sum of all completed rentals)
            this.prisma.rental.aggregate({
                where: { status: RentalStatus.COMPLETED },
                _sum: { totalAmount: true },
            }),
        ]);

        return {
            totalUsers,
            activeUsers,
            blockedUsers,
            pendingDocuments,
            totalRentals,
            activeRentals,
            totalRevenue: totalRevenue._sum.totalAmount || 0,
        };
    }

    async getUsers(
        page: number,
        pageSize: number,
        role?: Role,
        isVerified?: boolean,
        search?: string,
    ) {
        const skip = (page - 1) * pageSize;

        const where = {
            ...(role && { role }),
            ...(typeof isVerified === 'boolean' && { isVerified }),
            ...(search && {
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phoneNumber: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phoneNumber: true,
                    role: true,
                    isVerified: true,
                    createdAt: true,
                    documents: {
                        select: {
                            id: true,
                            documentType: true,
                            status: true,
                        },
                    },
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            users,
            pagination: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    async getRentals(
        page: number,
        pageSize: number,
        status?: RentalStatus,
        search?: string,
    ) {
        const skip = (page - 1) * pageSize;

        const where = {
            ...(status && { status }),
            ...(search && {
                OR: [
                    { user: { fullName: { contains: search, mode: 'insensitive' } } },
                    { car: { brand: { contains: search, mode: 'insensitive' } } },
                    { car: { model: { contains: search, mode: 'insensitive' } } },
                ],
            }),
        };

        const [rentals, total] = await Promise.all([
            this.prisma.rental.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            phoneNumber: true,
                        },
                    },
                    car: {
                        select: {
                            id: true,
                            brand: true,
                            model: true,
                            licensePlate: true,
                        },
                    },
                },
            }),
            this.prisma.rental.count({ where }),
        ]);

        return {
            rentals,
            pagination: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
} 