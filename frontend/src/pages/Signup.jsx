import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUserPlus, FaEnvelope, FaLock, FaUser, FaIdCard, FaBuilding, FaDoorOpen, FaCamera, FaCheckCircle, FaArrowRight } from 'react-icons/fa';

import { api } from '../api/axios';

const DEPARTMENTS = ['MCA', 'BCA', 'BTech', 'MTech', 'BPharma', 'BALLB', 'BSc', 'MSc'];
const HOSTELS = [
	'Vishwakarma Hostel',
	'Charak Hostel',
	'Dr. C.V. Raman Hostel',
	'Srinivasan Ramanujam Hostel (Boys)',
	'Meerabai Hostel (Girls)',
	'Draupadi Hostel (Girls)',
];

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
		department: DEPARTMENTS[0],
		roomNo: '',
		hostelName: HOSTELS[0],
	});
	const [photoFile, setPhotoFile] = useState(null);

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
			const data = new FormData();
			data.append('name', form.name);
			data.append('rollNo', form.rollNo);
			data.append('email', form.email);
			data.append('password', form.password);
			data.append('roomNo', form.roomNo);
			data.append('department', form.department);
			data.append('hostelName', form.hostelName);
			if (photoFile) data.append('photo', photoFile);

			const res = await api.post('/auth/signup', data);
			setSuccess(res.data?.message || 'Registration successful! A Brevo verification link has been sent to your email.');
			setDevVerifyUrl(res.data?.devVerifyUrl || '');
		} catch (err) {
			setError(getErrorMessage(err));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="page py-5">
			<div className="card shadow-lg border-0 mx-auto" style={{ maxWidth: 760, width: '100%' }}>
				<div className="card-header text-center bg-white border-0 pt-4 pb-2">
					<div className="stat-icon-wrapper stat-icon-emerald mx-auto mb-2" style={{ width: 56, height: 56, fontSize: '1.5rem' }}>
						<FaUserPlus />
					</div>
					<h3 className="h4 fw-bold text-dark mb-1">Student Account Registration</h3>
					<p className="text-muted small">Register for VBSPU Hostel Entry-Exit QR &amp; Face Gate Access</p>
				</div>

				<div className="card-body p-4">
					{error ? <div className="alert alert-danger py-2 small mb-3">{error}</div> : null}

					{success ? (
						<div className="alert alert-success p-4 rounded mb-4">
							<div className="d-flex align-items-center gap-2 fw-bold fs-5 mb-2">
								<FaCheckCircle className="text-success" /> Registration Successful!
							</div>
							<p className="mb-2">{success}</p>

							{devVerifyUrl ? (
								<div className="p-3 bg-white rounded border border-success-subtle mt-3">
									<strong className="text-dark small">Local Dev Verification Link:</strong>
									<div className="mt-1">
										<a href={devVerifyUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-success d-inline-flex align-items-center gap-1">
											Verify Email Now <FaArrowRight />
										</a>
									</div>
									<div className="form-text small mt-1">If Brevo API key is using local fallback, click the link above.</div>
								</div>
							) : null}

							<div className="mt-3 pt-2 border-top">
								After verifying your email, proceed to <Link to="/login" className="fw-bold text-success text-decoration-underline">Student Login</Link>.
							</div>
						</div>
					) : null}

					{!success && (
						<form onSubmit={onSubmit}>
							<div className="row g-3">
								<div className="col-md-6">
									<label className="form-label small fw-bold text-secondary">Full Name</label>
									<div className="input-group">
										<span className="input-group-text bg-light border-end-0"><FaUser className="text-muted" /></span>
										<input
											className="form-control border-start-0"
											placeholder="e.g. Priyanshu Singh"
											value={form.name}
											onChange={(e) => updateField('name', e.target.value)}
											required
										/>
									</div>
								</div>

								<div className="col-md-6">
									<label className="form-label small fw-bold text-secondary">Roll Number</label>
									<div className="input-group">
										<span className="input-group-text bg-light border-end-0"><FaIdCard className="text-muted" /></span>
										<input
											className="form-control border-start-0"
											placeholder="e.g. 21015001"
											value={form.rollNo}
											onChange={(e) => updateField('rollNo', e.target.value)}
											required
										/>
									</div>
								</div>

								<div className="col-md-6">
									<label className="form-label small fw-bold text-secondary">Official Email Address</label>
									<div className="input-group">
										<span className="input-group-text bg-light border-end-0"><FaEnvelope className="text-muted" /></span>
										<input
											type="email"
											className="form-control border-start-0"
											placeholder="student@gmail.com"
											value={form.email}
											onChange={(e) => updateField('email', e.target.value)}
											required
											autoComplete="email"
										/>
									</div>
								</div>

								<div className="col-md-6">
									<label className="form-label small fw-bold text-secondary">Account Password</label>
									<div className="input-group">
										<span className="input-group-text bg-light border-end-0"><FaLock className="text-muted" /></span>
										<input
											type="password"
											className="form-control border-start-0"
											placeholder="At least 6 characters"
											value={form.password}
											onChange={(e) => updateField('password', e.target.value)}
											required
											minLength={6}
											autoComplete="new-password"
										/>
									</div>
								</div>

								<div className="col-md-6">
									<label className="form-label small fw-bold text-secondary">Academic Department</label>
									<select
										className="form-select"
										value={form.department}
										onChange={(e) => updateField('department', e.target.value)}
										required
									>
										{DEPARTMENTS.map((d) => (
											<option key={d} value={d}>{d}</option>
										))}
									</select>
								</div>

								<div className="col-md-6">
									<label className="form-label small fw-bold text-secondary">Hostel Name</label>
									<div className="input-group">
										<span className="input-group-text bg-light border-end-0"><FaBuilding className="text-muted" /></span>
										<select
											className="form-select border-start-0"
											value={form.hostelName}
											onChange={(e) => updateField('hostelName', e.target.value)}
											required
										>
											{HOSTELS.map((h) => (
												<option key={h} value={h}>{h}</option>
											))}
										</select>
									</div>
								</div>

								<div className="col-md-6">
									<label className="form-label small fw-bold text-secondary">Room Number</label>
									<div className="input-group">
										<span className="input-group-text bg-light border-end-0"><FaDoorOpen className="text-muted" /></span>
										<input
											className="form-control border-start-0"
											placeholder="e.g. 104"
											value={form.roomNo}
											onChange={(e) => updateField('roomNo', e.target.value)}
											required
										/>
									</div>
								</div>

								<div className="col-md-6">
									<label className="form-label small fw-bold text-secondary">Profile Photo (Optional)</label>
									<div className="input-group">
										<span className="input-group-text bg-light border-end-0"><FaCamera className="text-muted" /></span>
										<input
											type="file"
											className="form-control border-start-0"
											accept="image/*"
											onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
										/>
									</div>
								</div>
							</div>

							<button className="btn btn-primary w-100 py-2 fw-bold mt-4" disabled={loading}>
								{loading ? 'Registering Account…' : 'Complete Signup'}
							</button>

							<div className="text-center mt-3 small">
								Already registered and verified? <Link to="/login" className="fw-bold text-primary text-decoration-none">Log In Here</Link>
							</div>
						</form>
					)}
				</div>
			</div>
		</div>
	);
}
