import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OtpService } from './otp.service';
import { SendOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { successResponse } from 'src/common/response.helper';

@ApiTags('otp')
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send OTP to phone number' })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
  })
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    const data = await this.otpService.sendOtp(sendOtpDto.phoneNumber);
    return successResponse(data, 'OTP sent successfully');
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify OTP' })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    const data = await this.otpService.verifyOtp(
      verifyOtpDto.sessionId,
      verifyOtpDto.otp,
    );
    return successResponse(data, 'OTP verified successfully');
  }
}
