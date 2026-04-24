import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAuth } from '../api/authStorage';

export default function ProtectedRoute({ allowedRoles }) {
	const auth = getAuth();
	const isAllowed = auth.token && (!allowedRoles || allowedRoles.includes(auth.role));

	if (!isAllowed) {
		const to = allowedRoles?.includes('admin') ? '/admin/login' : '/login';
		return <Navigate to={to} replace />;
	}

	return <Outlet />;
}
