import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEnvelope, FaPaperPlane, FaShieldAlt } from 'react-icons/fa';

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
			setResendSuccess(res.data?.message || 'Brevo verification email sent successfully.');
			setResendDevVerifyUrl(res.data?.devVerifyUrl || '');
		} catch (err) {
			setResendError(getErrorMessage(err));
		} finally {
			setResendLoading(false);
		}
	}

	return (
		<div className="page py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
			<div className="card shadow-lg border-0" style={{ maxWidth: 460, width: '100%' }}>
				<div className="card-header text-center bg-white border-0 pt-4 pb-0">
					<div className="stat-icon-wrapper stat-icon-blue mx-auto mb-2" style={{ width: 56, height: 56, fontSize: '1.5rem' }}>
						<FaUser />
					</div>
					<h3 className="h4 fw-bold text-dark mb-1">Student Login</h3>
					<p className="text-muted small">Sign in to your HostelQR student account</p>
				</div>

				<div className="card-body p-4">
					{error ? <div className="alert alert-danger py-2 small mb-3">{error}</div> : null}

					{showResend ? (
						<div className="mb-3 p-3 bg-light rounded border">
							{resendError ? <div className="alert alert-warning py-1 small">{resendError}</div> : null}
							{resendSuccess ? (
								<div className="alert alert-success py-2 small">
									{resendSuccess}
									{resendDevVerifyUrl ? (
										<div className="mt-2 pt-2 border-top">
											<strong>Dev verify link:</strong>{' '}
											<a href={resendDevVerifyUrl} target="_blank" rel="noreferrer" className="fw-bold">
												Click to Verify Account
											</a>
										</div>
									) : null}
								</div>
							) : null}

							<p className="small text-muted mb-2">Haven't verified your email yet?</p>
							<button
								type="button"
								className="btn btn-outline-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
								disabled={resendLoading || !email}
								onClick={onResendVerification}
							>
								<FaPaperPlane /> {resendLoading ? 'Sending via Brevo…' : 'Resend Brevo Verification Email'}
							</button>
						</div>
					) : null}

					<form onSubmit={onSubmit}>
						<div className="mb-3">
							<label className="form-label small fw-bold text-secondary">Email Address</label>
							<div className="input-group">
								<span className="input-group-text bg-light border-end-0"><FaEnvelope className="text-muted" /></span>
								<input
									type="email"
									className="form-control border-start-0"
									placeholder="student@university.ac.in"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									autoComplete="email"
								/>
							</div>
						</div>

						<div className="mb-4">
							<label className="form-label small fw-bold text-secondary">Password</label>
							<div className="input-group">
								<span className="input-group-text bg-light border-end-0"><FaLock className="text-muted" /></span>
								<input
									type="password"
									className="form-control border-start-0"
									placeholder="••••••••"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									autoComplete="current-password"
								/>
							</div>
						</div>

						<button className="btn btn-primary w-100 py-2 fw-bold mb-3" disabled={loading}>
							{loading ? 'Logging in…' : 'Log In'}
						</button>

						<div className="d-flex justify-content-between align-items-center small border-top pt-3">
							<span className="text-muted">Don’t have an account?</span>
							<Link to="/signup" className="fw-bold text-primary text-decoration-none">Create Account</Link>
						</div>
					</form>
				</div>

				<div className="card-footer bg-light text-center py-3 border-0 rounded-bottom">
					<Link to="/admin/login" className="text-secondary small text-decoration-none d-inline-flex align-items-center gap-1">
						<FaShieldAlt /> Are you a Guard or Warden? <strong>Guard Login</strong>
					</Link>
				</div>
			</div>
		</div>
	);
}
