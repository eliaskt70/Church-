import { body, query, param } from 'express-validator';

export const requestOtpValidator = [
  body('phone')
    .isString()
    .matches(/^\+?[1-9]\d{6,14}$/)
    .withMessage('Valid phone number is required (E.164 format)'),
];

export const verifyOtpValidator = [
  body('phone')
    .isString()
    .matches(/^\+?[1-9]\d{6,14}$/)
    .withMessage('Valid phone number is required'),
  body('code')
    .isString()
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP code must be 6 digits'),
];

export const googleAuthValidator = [
  body('token').isString().notEmpty().withMessage('Google token is required'),
];

export const updateProfileValidator = [
  body('name').optional().isString().isLength({ min: 1, max: 100 }),
  body('avatar_url').optional().isString().isURL(),
  body('account_type').optional().isIn(['beneficiary', 'provider']),
];

export const updateLocationValidator = [
  body('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
];

export const createServiceValidator = [
  body('title').isString().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
  body('description').optional().isString(),
  body('category')
    .isIn([
      'home_maintenance',
      'educational',
      'handcrafts',
      'home_cooking',
      'delivery',
      'beauty',
      'tech_support',
      'other',
    ])
    .withMessage('Valid category is required'),
  body('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('radius_km').optional().isFloat({ min: 0.1, max: 100 }),
  body('photos').optional().isArray(),
];

export const updateServiceValidator = [
  body('title').optional().isString().isLength({ min: 1, max: 200 }),
  body('description').optional().isString(),
  body('category')
    .optional()
    .isIn([
      'home_maintenance',
      'educational',
      'handcrafts',
      'home_cooking',
      'delivery',
      'beauty',
      'tech_support',
      'other',
    ]),
  body('lat').optional().isFloat({ min: -90, max: 90 }),
  body('lng').optional().isFloat({ min: -180, max: 180 }),
  body('radius_km').optional().isFloat({ min: 0.1, max: 100 }),
  body('photos').optional().isArray(),
];

export const geoSearchValidator = [
  query('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude is required and must be between -90 and 90'),
  query('lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude is required and must be between -180 and 180'),
  query('radius_km').optional().isFloat({ min: 0.1, max: 100 }),
  query('category')
    .optional()
    .isIn([
      'home_maintenance',
      'educational',
      'handcrafts',
      'home_cooking',
      'delivery',
      'beauty',
      'tech_support',
      'other',
    ]),
];

export const serviceIdValidator = [
  param('id').isUUID().withMessage('Valid service ID is required'),
];

export const sendMessageValidator = [
  body('receiver_id').isUUID().withMessage('Valid receiver ID is required'),
  body('content').isString().isLength({ min: 1, max: 5000 }).withMessage('Message content is required'),
];

export const conversationIdValidator = [
  param('conversationId').isUUID().withMessage('Valid conversation ID is required'),
];

export const paginationValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

export const createRatingValidator = [
  body('service_id').isUUID().withMessage('Valid service ID is required'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString().isLength({ max: 1000 }),
];

export const serviceRatingsValidator = [
  param('serviceId').isUUID().withMessage('Valid service ID is required'),
];
