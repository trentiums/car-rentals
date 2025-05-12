import { ApiProperty } from '@nestjs/swagger';

export class UserStatsDto {
    @ApiProperty({ description: 'Total number of trips/requirements posted' })
    totalTrips: number;

    @ApiProperty({ description: 'Total number of posts created' })
    totalPosts: number;

    @ApiProperty({ description: 'Total number of active trips' })
    activeTrips: number;

    @ApiProperty({ description: 'Total number of completed trips' })
    completedTrips: number;

    @ApiProperty({ description: 'Total number of active posts' })
    activePosts: number;

    @ApiProperty({ description: 'Total number of documents uploaded' })
    totalDocuments: number;

    @ApiProperty({ description: 'Number of approved documents' })
    approvedDocuments: number;

    @ApiProperty({ description: 'Number of rejected documents' })
    rejectedDocuments: number;
}

export class UserProfileDto {
    @ApiProperty({ description: 'User ID' })
    id: string;

    @ApiProperty({ description: 'User\'s full name' })
    fullName: string;

    @ApiProperty({ description: 'User\'s phone number' })
    phoneNumber: string;

    @ApiProperty({ description: 'User\'s email address', nullable: true })
    email: string | null;

    @ApiProperty({ description: 'User\'s business name', nullable: true })
    businessName: string | null;

    @ApiProperty({ description: 'User\'s business description', nullable: true })
    businessDescription: string | null;

    @ApiProperty({ description: 'User\'s city', nullable: true })
    city: string | null;

    @ApiProperty({ description: 'User\'s state', nullable: true })
    state: string | null;

    @ApiProperty({ description: 'User\'s PIN code', nullable: true })
    pinCode: string | null;

    @ApiProperty({ description: 'Whether the user is verified' })
    isVerified: boolean;

    @ApiProperty({ description: 'User\'s role' })
    role: string;

    @ApiProperty({ type: UserStatsDto, description: 'User statistics' })
    stats: UserStatsDto;

    @ApiProperty({ description: 'Creation timestamp' })
    createdAt: Date;
} 