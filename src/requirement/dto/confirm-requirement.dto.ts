import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class ConfirmRequirementDto {
  @ApiProperty()
  @IsString()
  requirementId: string;
}

export class AssignRequirementDto {
  @ApiProperty()
  @IsString()
  requirementId: string;

  @IsString()
  @Length(10, 10)
  @Matches(/^[0-9]+$/, { message: 'Phone number must contain only digits' })
  phoneNumber: string;
}
