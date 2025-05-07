import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('types')
  @ApiOperation({
    summary: 'Get document and post types with supported formats',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns document and post types with their supported image formats and max sizes',
  })
  getDocumentAndPostTypes() {
    return this.settingsService.getDocumentAndPostTypes();
  }
}
