import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AddBusinessCityDto {
  @ApiProperty({ description: 'ID of the city to add as a business city' })
  @IsString()
  @IsNotEmpty()
  cityId: string;
}
