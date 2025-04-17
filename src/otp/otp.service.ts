import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class OtpService {
  private readonly apiKey = process.env.OTP_API_KEY;

  // Send OTP
  async sendOtp(phoneNumber: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://2factor.in/API/V1/${this.apiKey}/SMS/${phoneNumber}/AUTOGEN`
      );

      if (response.data.Status === 'Success') {
        return {
          success: true,
          message: 'OTP sent successfully',
          sessionId: response.data.Details,
        };
      } else {
        throw new HttpException('Failed to send OTP', HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      console.error('Error sending OTP:', error?.response?.data || error.message);
      throw new HttpException(
        'Failed to send OTP',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Verify OTP
  async verifyOtp(sessionId: string, otp: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://2factor.in/API/V1/${this.apiKey}/SMS/VERIFY/${sessionId}/${otp}`
      );

      if (response.data.Status === 'Success') {
        return {
          success: true,
          message: 'OTP verified successfully',
        };
      } else {
        throw new HttpException('Invalid OTP', HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error?.response?.data || error.message);
      throw new HttpException('OTP verification failed', HttpStatus.BAD_REQUEST);
    }
  }

  async resendOtp(phoneNumber: string): Promise<any> {
    return this.sendOtp(phoneNumber);
  }
}
