// Centralized error helpers to keep controllers clean.

export function notFound(req, res, next) {
	res.status(404);
	next(new Error(`Not Found - ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
	// Handle body-parser / Express payload-too-large errors gracefully.
	const isPayloadTooLarge =
		err?.type === 'entity.too.large' ||
		err?.status === 413 ||
		err?.statusCode === 413 ||
		/Request entity too large/i.test(err?.message || '');

	const statusCode = isPayloadTooLarge
		? 413
		: res.statusCode && res.statusCode !== 200
			? res.statusCode
			: err?.statusCode || err?.status || 500;

	if (isPayloadTooLarge) {
		console.warn('[api] Payload too large:', {
			path: req.originalUrl,
			method: req.method,
		});
	}

	res.status(statusCode).json({
		success: false,
		message: isPayloadTooLarge
			? 'Request payload is too large. Please capture a smaller image and try again.'
			: err?.message || 'Server error',
		// Don’t leak stack traces in production.
		stack: process.env.NODE_ENV === 'production' ? undefined : err?.stack,
	});
}
