import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AddBusinessCityDto {
  @ApiProperty({ description: 'Name of the city to add as a business city' })
  @IsString()
  @IsNotEmpty()
  cityName: string;

  @ApiProperty({ description: 'State of the city' })
  @IsString()
  @IsNotEmpty()
  state: string;
}
