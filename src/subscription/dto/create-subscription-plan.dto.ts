import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class CreateSubscriptionPlanDto {
    @ApiProperty({
        description: 'Name of the subscription plan',
        example: 'Monthly Plan',
    })
    @IsString()
    planName: string;

    @ApiProperty({
        description: 'Duration of the plan',
        example: '1 month',
    })
    @IsString()
    duration: string;

    @ApiProperty({
        description: 'Price of the plan',
        example: 300,
    })
    @IsNumber()
    price: number;

    @ApiProperty({
        description: 'Description of the plan',
        example: 'Access for one month.',
    })
    @IsString()
    description: string;

    @ApiProperty({
        description: 'Features included in the plan',
        example: ['Up to 10 posts per month', 'Basic customer support'],
    })
    @IsArray()
    @IsString({ each: true })
    features: string[];

    @ApiProperty({
        description: 'Benefits of the plan',
        example: ['Access to basic features', 'Get listed on the platform'],
    })
    @IsArray()
    @IsString({ each: true })
    benefits: string[];

    @ApiProperty({
        description: 'Whether the plan is active',
        example: true,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
} 