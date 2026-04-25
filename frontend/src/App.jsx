import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute.jsx';

import PublicLayout from './components/PublicLayout.jsx';

import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Help from './pages/Help.jsx';
import Support from './pages/Support.jsx';

import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import AttendanceHistory from './pages/AttendanceHistory.jsx';

import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

export default function App() {
	return (
		<Routes>
			<Route element={<PublicLayout />}>
				<Route path="/" element={<Home />} />
				<Route path="/about" element={<About />} />
				<Route path="/help" element={<Help />} />
				<Route path="/support" element={<Support />} />

				<Route path="/login" element={<Login />} />
				<Route path="/signup" element={<Signup />} />
				<Route path="/verify/:token" element={<VerifyEmail />} />
				<Route path="/admin/login" element={<AdminLogin />} />
			</Route>

			<Route element={<ProtectedRoute allowedRoles={["student"]} />}>
				<Route path="/dashboard" element={<StudentDashboard />} />
				<Route path="/student/dashboard" element={<StudentDashboard />} />
				<Route path="/student/attendance" element={<AttendanceHistory />} />
			</Route>
			<Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
				<Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
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
