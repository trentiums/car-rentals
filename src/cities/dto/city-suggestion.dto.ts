import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CitySearchDto {
  @ApiProperty({
    description: 'Search query for city suggestions',
    minLength: 2,
    maxLength: 50,
    example: 'mum'
  })
  @IsString()
  @MinLength(2, { message: 'Query must be at least 2 characters long' })
  @MaxLength(50, { message: 'Query cannot exceed 50 characters' })
  query: string;
}

export class CityResponseDto {
  @ApiProperty({ example: 'Mumbai' })
  name: string;

  @ApiProperty({ example: 'Maharashtra' })
  state: string;

  @ApiProperty({ example: 12691836 })
  population: number;

  @ApiProperty({ example: '19.07283' })
  latitude: string;

  @ApiProperty({ example: '72.88261' })
  longitude: string;
}
