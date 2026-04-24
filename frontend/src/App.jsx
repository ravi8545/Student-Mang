import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute.jsx';

import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import AttendanceHistory from './pages/AttendanceHistory.jsx';

import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

export default function App() {
	return (
		<Routes>
			<Route path="/" element={<Navigate to="/login" replace />} />

			<Route path="/login" element={<Login />} />
			<Route path="/signup" element={<Signup />} />

			<Route element={<ProtectedRoute allowedRoles={["student"]} />}>
				<Route path="/student/dashboard" element={<StudentDashboard />} />
				<Route path="/student/attendance" element={<AttendanceHistory />} />
			</Route>

			<Route path="/admin/login" element={<AdminLogin />} />
			<Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
				<Route path="/admin/dashboard" element={<AdminDashboard />} />
			</Route>

			<Route
				path="*"
				element={
					<div className="page">
						<div className="alert alert-warning">Page not found</div>
					</div>
				}
			/>
		</Routes>
	);
}
