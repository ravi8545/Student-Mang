import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { api } from '../api/axios';
import { setAuth } from '../api/authStorage';

function getErrorMessage(err) {
	return (
		err?.response?.data?.message ||
		err?.response?.data?.error ||
		err?.message ||
		'Something went wrong'
	);
}

export default function AdminLogin() {
	const navigate = useNavigate();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	async function onSubmit(e) {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			const res = await api.post('/admin/login', { email, password });
			setAuth({ token: res.data.token, role: 'admin' });
			navigate('/admin/dashboard', { replace: true });
		} catch (err) {
			setError(getErrorMessage(err));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="page">
			<div className="d-flex justify-content-between align-items-center mb-3">
				<h3 className="m-0">Guard/Admin Login</h3>
				<Link className="btn btn-outline-secondary btn-sm" to="/login">
					Student Login
				</Link>
			</div>

			<div className="card">
				<div className="card-body">
					{error ? <div className="alert alert-danger">{error}</div> : null}

					<form onSubmit={onSubmit}>
						<div className="mb-3">
							<label className="form-label">Admin Email</label>
							<input
								type="email"
								className="form-control"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>

						<div className="mb-3">
							<label className="form-label">Password</label>
							<input
								type="password"
								className="form-control"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>

						<button className="btn btn-primary" disabled={loading}>
							{loading ? 'Logging in…' : 'Login'}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}
