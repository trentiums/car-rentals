export const SETTINGS = {
  document_types: {
    types: [
      'AADHAR_FRONT',
      'AADHAR_BACK',
      'DRIVING_LICENSE_FRONT',
      'DRIVING_LICENSE_BACK',
    ],
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/jpg'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  post_types: {
    types: ['IMAGE'],
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/jpg'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
} as const;
