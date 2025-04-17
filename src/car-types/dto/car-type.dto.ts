import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCarTypeDto {
  @ApiProperty({ example: 'SUV' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Sport Utility Vehicle', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCarTypeDto {
  @ApiProperty({ example: 'SUV', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Sport Utility Vehicle', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
