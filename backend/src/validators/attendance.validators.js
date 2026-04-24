import { body } from 'express-validator';
import { validate } from './validate.js';

export const scanValidator = [
	body('studentId').optional().isString().withMessage('studentId must be a string'),
	body('qrText').optional().isString().withMessage('qrText must be a string'),
	body().custom((_, { req }) => {
		if (!req.body.studentId && !req.body.qrText) {
			throw new Error('studentId or qrText is required');
		}
		return true;
	}),
	validate,
];
