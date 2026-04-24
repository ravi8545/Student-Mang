import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api/axios';

function getErrorMessage(err) {
	return (
		err?.response?.data?.message ||
		err?.response?.data?.error ||
		err?.message ||
		'Something went wrong'
	);
}

export default function Signup() {
	const [form, setForm] = useState({
		name: '',
		rollNo: '',
		email: '',
		password: '',
		department: '',
		roomNo: '',
		hostelName: '',
	});

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [devVerifyUrl, setDevVerifyUrl] = useState('');

	function updateField(key, value) {
		setForm((prev) => ({ ...prev, [key]: value }));
	}

	async function onSubmit(e) {
		e.preventDefault();
		setError('');
		setSuccess('');
		setDevVerifyUrl('');
		setLoading(true);

		try {
			const res = await api.post('/auth/signup', form);
			setSuccess(res.data?.message || 'Signup successful. Please verify your email.');
			setDevVerifyUrl(res.data?.devVerifyUrl || '');
		} catch (err) {
			setError(getErrorMessage(err));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="page">
			<h3 className="mb-3">Student Signup</h3>

			<div className="card">
				<div className="card-body">
					{error ? <div className="alert alert-danger">{error}</div> : null}
					{success ? (
						<div className="alert alert-success">
							{success}
							{devVerifyUrl ? (
								<div className="mt-2">
									Dev verify link:{' '}
									<a href={devVerifyUrl} target="_blank" rel="noreferrer">
										Verify Email
									</a>
									<div className="small text-muted">
										Email sending is not configured on the server yet.
									</div>
								</div>
							) : null}
							<div className="mt-2">
								After verification, go to <Link to="/login">Login</Link>.
							</div>
						</div>
					) : null}

					<form onSubmit={onSubmit}>
						<div className="row">
							<div className="col-md-6 mb-3">
								<label className="form-label">Name</label>
								<input
									className="form-control"
									value={form.name}
									onChange={(e) => updateField('name', e.target.value)}
									required
								/>
							</div>
							<div className="col-md-6 mb-3">
								<label className="form-label">Roll No</label>
								<input
									className="form-control"
									value={form.rollNo}
									onChange={(e) => updateField('rollNo', e.target.value)}
									required
								/>
							</div>

							<div className="col-md-6 mb-3">
								<label className="form-label">Email</label>
								<input
									type="email"
									className="form-control"
									value={form.email}
									onChange={(e) => updateField('email', e.target.value)}
									required
									autoComplete="email"
								/>
							</div>
							<div className="col-md-6 mb-3">
								<label className="form-label">Password</label>
								<input
									type="password"
									className="form-control"
									value={form.password}
									onChange={(e) => updateField('password', e.target.value)}
									required
									minLength={6}
									autoComplete="new-password"
								/>
							</div>

							<div className="col-md-6 mb-3">
								<label className="form-label">Department</label>
								<input
									className="form-control"
									value={form.department}
									onChange={(e) => updateField('department', e.target.value)}
									required
								/>
							</div>
							<div className="col-md-3 mb-3">
								<label className="form-label">Room No</label>
								<input
									className="form-control"
									value={form.roomNo}
									onChange={(e) => updateField('roomNo', e.target.value)}
									required
								/>
							</div>
							<div className="col-md-3 mb-3">
								<label className="form-label">Hostel Name</label>
								<input
									className="form-control"
									value={form.hostelName}
									onChange={(e) => updateField('hostelName', e.target.value)}
									required
								/>
							</div>
						</div>

						<button className="btn btn-success" disabled={loading}>
							{loading ? 'Creating account…' : 'Sign up'}
						</button>

						<div className="mt-3">
							Already verified? <Link to="/login">Login</Link>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
