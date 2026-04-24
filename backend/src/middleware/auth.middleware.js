import jwt from 'jsonwebtoken';

// Protects routes using JWT in Authorization header: "Bearer <token>".
export function protect(req, res, next) {
	const authHeader = req.headers.authorization || '';
	const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

	if (!token) {
		return res.status(401).json({
			success: false,
			message: 'Authentication required',
		});
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded;
		return next();
	} catch (err) {
		return res.status(401).json({
			success: false,
			message: 'Invalid or expired token',
		});
	}
}

// Role-based access control (student vs admin/guard).
export function requireRole(...allowedRoles) {
	return function roleMiddleware(req, res, next) {
		const role = req.user?.role;
		if (!role || !allowedRoles.includes(role)) {
			return res.status(403).json({
				success: false,
				message: 'Forbidden',
			});
		}
		return next();
	};
}
