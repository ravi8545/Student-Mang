import { body } from 'express-validator';
import { validate } from './validate.js';

const MAX_FACE_IMAGE_DATA_URL_LENGTH = 1_500_000;

export const faceRegisterValidator = [
	body('faceLandmarks').isArray({ min: 1 }).withMessage('faceLandmarks is required'),
	body('faceImageDataUrl')
		.optional()
		.isString()
		.withMessage('faceImageDataUrl must be a string')
		.custom((value) => {
			if (!value) return true;
			if (value.length > MAX_FACE_IMAGE_DATA_URL_LENGTH) {
				throw new Error('faceImageDataUrl is too large. Please capture a smaller/compressed image.');
			}
			return true;
		}),
	validate,
];

export const faceVerifyValidator = [
	body('faceLandmarks').isArray({ min: 1 }).withMessage('faceLandmarks is required'),
	validate,
];