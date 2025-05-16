import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EditPostDto {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiPropertyOptional({ description: 'The content of the post' })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    content?: string;

    @ApiPropertyOptional({
        description: 'The location where the post was created',
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    location?: string;

    @ApiPropertyOptional({
        description: 'The existing photo ids of the post',
    })
    @IsOptional()
    @IsString()
    existingPhotoIds?: string[];

} 