import { body } from 'express-validator';
import { validate } from './validate.js';

export const studentSignupValidator = [
	body('name').trim().notEmpty().withMessage('Name is required'),
	body('rollNo').trim().notEmpty().withMessage('Roll number is required'),
	body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
	body('password')
		.isLength({ min: 6, max: 128 })
		.withMessage('Password must be at least 6 characters'),
	body('department').trim().notEmpty().withMessage('Department is required'),
	body('roomNo').trim().notEmpty().withMessage('Room number is required'),
	body('hostelName').trim().notEmpty().withMessage('Hostel name is required'),
	validate,
];

export const studentLoginValidator = [
	body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
	body('password').notEmpty().withMessage('Password is required'),
	validate,
];

export const adminLoginValidator = [
	body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
	body('password').notEmpty().withMessage('Password is required'),
	validate,
];

export const resendVerificationValidator = [
	body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
	validate,
];
