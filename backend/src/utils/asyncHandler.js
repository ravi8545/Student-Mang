// Wrap async route handlers so errors go to Express error middleware.
export default function asyncHandler(handler) {
	return function wrapped(req, res, next) {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}
