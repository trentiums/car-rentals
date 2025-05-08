import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AddFeatureDto {
    @ApiProperty({
        description: 'The feature to add to the subscription plan',
        example: '24/7 Customer Support',
    })
    @IsString()
    @IsNotEmpty()
    feature: string;
}

export class UpdateFeatureDto {
    @ApiProperty({
        description: 'The existing feature to update',
        example: 'Basic Support',
    })
    @IsString()
    @IsNotEmpty()
    oldFeature: string;

    @ApiProperty({
        description: 'The new feature to replace the old one',
        example: 'Premium Support',
    })
    @IsString()
    @IsNotEmpty()
    newFeature: string;
}

export class RemoveFeatureDto {
    @ApiProperty({
        description: 'The feature to remove from the subscription plan',
        example: 'Basic Support',
    })
    @IsString()
    @IsNotEmpty()
    feature: string;
} 