// Centralized error helpers to keep controllers clean.

export function notFound(req, res, next) {
	res.status(404);
	next(new Error(`Not Found - ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
	const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

	res.status(statusCode).json({
		success: false,
		message: err?.message || 'Server error',
		// Don’t leak stack traces in production.
		stack: process.env.NODE_ENV === 'production' ? undefined : err?.stack,
	});
}
