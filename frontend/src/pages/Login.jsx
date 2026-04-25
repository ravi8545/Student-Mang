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

export default function Login() {
	const navigate = useNavigate();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [resendLoading, setResendLoading] = useState(false);
	const [resendSuccess, setResendSuccess] = useState('');
	const [resendDevVerifyUrl, setResendDevVerifyUrl] = useState('');
	const [resendError, setResendError] = useState('');

	const showResend =
		Boolean(error) &&
		error.toLowerCase().includes('verify your email before logging in');

	async function onSubmit(e) {
		e.preventDefault();
		setError('');
		setResendSuccess('');
		setResendDevVerifyUrl('');
		setResendError('');
		setLoading(true);

		try {
			const res = await api.post('/auth/login', { email, password });
			setAuth({ token: res.data.token, role: 'student' });
			navigate('/dashboard', { replace: true });
		} catch (err) {
			setError(getErrorMessage(err));
		} finally {
			setLoading(false);
		}
	}

	async function onResendVerification() {
		setResendSuccess('');
		setResendDevVerifyUrl('');
		setResendError('');
		setResendLoading(true);

		try {
			const res = await api.post('/auth/resend-verification', { email });
			setResendSuccess(res.data?.message || 'Verification email sent.');
			setResendDevVerifyUrl(res.data?.devVerifyUrl || '');
		} catch (err) {
			setResendError(getErrorMessage(err));
		} finally {
			setResendLoading(false);
		}
	}

	return (
		<div className="page py-4">
			<div className="d-flex justify-content-between align-items-center mb-3">
				<h3 className="m-0">Student Login</h3>
				<Link className="btn btn-outline-secondary btn-sm" to="/admin">
					Guard/Admin Login
				</Link>
			</div>

			<div className="card">
				<div className="card-body">
					{error ? <div className="alert alert-danger">{error}</div> : null}
					{showResend ? (
						<div className="mb-3">
							{resendError ? (
								<div className="alert alert-warning">{resendError}</div>
							) : null}
							{resendSuccess ? (
								<div className="alert alert-success">
									{resendSuccess}
									{resendDevVerifyUrl ? (
										<div className="mt-2">
											Dev verify link:{' '}
											<a href={resendDevVerifyUrl} target="_blank" rel="noreferrer">
												Verify Email
											</a>
											<div className="small text-muted">
												Email sending may not be configured on the server.
											</div>
										</div>
									) : null}
								</div>
							) : null}

							<button
								type="button"
								className="btn btn-outline-primary btn-sm"
								disabled={resendLoading || !email}
								onClick={onResendVerification}
							>
								{resendLoading ? 'Sending…' : 'Resend Verification Email'}
							</button>
						</div>
					) : null}

					<form onSubmit={onSubmit}>
						<div className="mb-3">
							<label className="form-label">Email</label>
							<input
								type="email"
								className="form-control"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								autoComplete="email"
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
								autoComplete="current-password"
							/>
						</div>

						<button className="btn btn-primary" disabled={loading}>
							{loading ? 'Logging in…' : 'Login'}
						</button>

						<div className="mt-3">
							Don’t have an account? <Link to="/signup">Sign up</Link>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
