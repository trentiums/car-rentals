import {
  Controller,
  Get,
  HttpStatus,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CitiesService } from './cities.service';
import { CitySearchDto, CityResponseDto } from './dto/city-suggestion.dto';

@ApiTags('cities')
@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get('suggestions')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Get city suggestions based on search query' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a list of city suggestions',
    type: CityResponseDto,
    isArray: true,
  })
  async getCitySuggestions(@Query() searchDto: CitySearchDto) {
    const suggestions = await this.citiesService.getCitySuggestions(
      searchDto.query,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Cities are fetched successfully',
      data: suggestions,
    };
  }
}
