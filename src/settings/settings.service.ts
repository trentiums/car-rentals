import { HttpStatus, Injectable } from '@nestjs/common';
import { SETTINGS } from './constants';

@Injectable()
export class SettingsService {
  getDocumentAndPostTypes() {
    return {
      statusCode: HttpStatus.OK,
      message: 'Settings data fetched successfully',
      data: SETTINGS,
    };
  }
}
