import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user || !user.id) {
            throw new UnauthorizedException('User not authenticated');
        }

        // Get the user from the database to ensure we have the latest role
        const dbUser = await this.prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!dbUser) {
            throw new UnauthorizedException('User not found');
        }

        return requiredRoles.includes(dbUser.role);
    }
} 