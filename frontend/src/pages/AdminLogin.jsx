import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaEnvelope, FaLock, FaUserGraduate } from 'react-icons/fa';

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
		<div className="page py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
			<div className="card shadow-lg border-0" style={{ maxWidth: 460, width: '100%' }}>
				<div className="card-header text-center bg-dark text-white pt-4 pb-3 rounded-top">
					<div className="stat-icon-wrapper bg-white text-dark mx-auto mb-2" style={{ width: 56, height: 56, fontSize: '1.5rem' }}>
						<FaShieldAlt className="text-primary" />
					</div>
					<h3 className="h4 fw-bold text-white mb-1">Guard &amp; Warden Login</h3>
					<p className="text-light opacity-75 small m-0">VBSPU Hostel Security Terminal</p>
				</div>

				<div className="card-body p-4">
					{error ? <div className="alert alert-danger py-2 small mb-3">{error}</div> : null}

					<form onSubmit={onSubmit}>
						<div className="mb-3">
							<label className="form-label small fw-bold text-secondary">Guard Official Email</label>
							<div className="input-group">
								<span className="input-group-text bg-light border-end-0"><FaEnvelope className="text-muted" /></span>
								<input
									type="email"
									className="form-control border-start-0"
									placeholder="guard@hostel.local"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
								/>
							</div>
						</div>

						<div className="mb-4">
							<label className="form-label small fw-bold text-secondary">Security Password</label>
							<div className="input-group">
								<span className="input-group-text bg-light border-end-0"><FaLock className="text-muted" /></span>
								<input
									type="password"
									className="form-control border-start-0"
									placeholder="••••••••"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
								/>
							</div>
						</div>

						<button className="btn btn-dark w-100 py-2 fw-bold mb-3 d-flex align-items-center justify-content-center gap-2" disabled={loading}>
							<FaShieldAlt /> {loading ? 'Authenticating…' : 'Access Security Console'}
						</button>
					</form>
				</div>

				<div className="card-footer bg-light text-center py-3 border-0 rounded-bottom">
					<Link to="/login" className="text-secondary small text-decoration-none d-inline-flex align-items-center gap-1">
						<FaUserGraduate /> Student? <strong>Go to Student Login</strong>
					</Link>
				</div>
			</div>
		</div>
	);
}
