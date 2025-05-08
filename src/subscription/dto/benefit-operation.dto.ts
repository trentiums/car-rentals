import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AddBenefitDto {
    @ApiProperty({
        description: 'The benefit to add to the subscription plan',
        example: 'Priority Customer Service',
    })
    @IsString()
    @IsNotEmpty()
    benefit: string;
}

export class UpdateBenefitDto {
    @ApiProperty({
        description: 'The existing benefit to update',
        example: 'Basic Priority',
    })
    @IsString()
    @IsNotEmpty()
    oldBenefit: string;

    @ApiProperty({
        description: 'The new benefit to replace the old one',
        example: 'Premium Priority',
    })
    @IsString()
    @IsNotEmpty()
    newBenefit: string;
}

export class RemoveBenefitDto {
    @ApiProperty({
        description: 'The benefit to remove from the subscription plan',
        example: 'Basic Priority',
    })
    @IsString()
    @IsNotEmpty()
    benefit: string;
} 