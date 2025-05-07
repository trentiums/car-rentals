import { HttpStatus } from '@nestjs/common';

export function successResponse(
  data: any = null,
  message = 'Success',
  statusCode: number = HttpStatus.OK,
) {
  return {
    statusCode,
    message,
    data,
  };
}

export function errorResponse(
  message = 'Something went wrong',
  statusCode: number = HttpStatus.BAD_REQUEST,
  error: any = null,
) {
  return {
    statusCode,
    message,
    error,
  };
}
