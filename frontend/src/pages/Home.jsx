import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaQrcode, FaUserCheck, FaShieldAlt, FaClock, FaPhoneAlt, FaCheckCircle, FaUserGraduate } from 'react-icons/fa';

import bannerUrl from '../assets/university.jpg';

function isValidIndianMobile(value) {
	const v = String(value || '').trim();
	return /^[0-9]{10}$/.test(v);
}

export default function Home() {
	const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
	const endpoint = useMemo(() => 'https://api.web3forms.com/submit', []);

	const dateFormatter = useMemo(
		() =>
			new Intl.DateTimeFormat('en-GB', {
				weekday: 'long',
				day: 'numeric',
				month: 'long',
				year: 'numeric',
			}),
		[]
	);
	const timeFormatter = useMemo(
		() =>
			new Intl.DateTimeFormat('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				second: '2-digit',
				hour12: true,
			}),
		[]
	);
	const [now, setNow] = useState(() => new Date());

	const [cbName, setCbName] = useState('');
	const [cbMobile, setCbMobile] = useState('');
	const [cbLoading, setCbLoading] = useState(false);
	const [cbError, setCbError] = useState('');
	const [cbSuccess, setCbSuccess] = useState('');

	useEffect(() => {
		const id = window.setInterval(() => setNow(new Date()), 1000);
		return () => window.clearInterval(id);
	}, []);

	const formattedNow = `${dateFormatter.format(now)} • ${String(
		timeFormatter.format(now)
	).toUpperCase()}`;

	async function submitCallbackRequest(e) {
		e.preventDefault();
		setCbError('');
		setCbSuccess('');

		if (!cbName.trim()) {
			setCbError('Please enter your name.');
			return;
		}
		if (!isValidIndianMobile(cbMobile)) {
			setCbError('Please enter a valid 10-digit mobile number.');
			return;
		}
		if (!accessKey) {
			setCbError(
				'Callback form is not configured. Create frontend/.env with VITE_WEB3FORMS_ACCESS_KEY and restart the dev server.'
			);
			return;
		}

		setCbLoading(true);
		try {
			const payload = {
				access_key: accessKey,
				subject: 'HostelQR - Request a Callback',
				name: cbName,
				mobile: cbMobile,
				message: `Callback request from ${cbName} (${cbMobile}).`,
			};

			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
			const data = await res.json().catch(() => null);

			if (!res.ok || !data?.success) {
				throw new Error(data?.message || 'Failed to submit. Please try again.');
			}

			setCbSuccess('Request submitted successfully. We will call you back soon.');
			setCbName('');
			setCbMobile('');
		} catch (err) {
			setCbError(err?.message || 'Failed to submit. Please try again.');
		} finally {
			setCbLoading(false);
		}
	}

	return (
		<div className="page py-4">
			{/* Hero Section */}
			<div className="card hero-card overflow-hidden mb-4">
				<div className="row g-0 align-items-stretch">
					<div className="col-lg-7 p-4 p-lg-5 d-flex flex-column justify-content-center">
						<div className="d-flex flex-wrap align-items-center gap-2 mb-3">
							<span className="hero-badge d-inline-flex align-items-center gap-2">
								<FaClock /> {formattedNow}
							</span>
						</div>

						<h1 className="hero-title mb-3">
							Veer Bahadur Singh Purvanchal University
						</h1>
						
						<p className="lead fw-semibold text-primary mb-3" style={{ fontSize: '1.2rem' }}>
							AI-Powered QR Code &amp; Face Recognition Hostel Attendance System
						</p>

						<p className="text-muted mb-4" style={{ lineHeight: '1.6' }}>
							Streamlining student entry and exit tracking with real-time verification, digital pass codes, Brevo automated notifications, and guard supervision.
						</p>

						<div className="d-flex flex-wrap gap-3">
							<Link to="/signup" className="btn btn-primary btn-lg d-flex align-items-center gap-2">
								<FaUserGraduate /> Register Student Account
							</Link>
							<Link to="/login" className="btn btn-outline-primary btn-lg">
								Student Login
							</Link>
						</div>
					</div>

					<div className="col-lg-5 hero-media position-relative min-vh-30">
						<img
							src={bannerUrl}
							alt="University banner"
							className="w-100 h-100 position-absolute inset-0"
							style={{ objectFit: 'cover' }}
						/>
						<div className="position-absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.4) 0%, transparent 100%)' }} />
					</div>
				</div>
			</div>

			{/* Stat Highlights Bar */}
			<div className="row g-3 mb-4">
				<div className="col-6 col-md-3">
					<div className="stat-card">
						<div className="stat-icon-wrapper stat-icon-blue">
							<FaQrcode />
						</div>
						<div>
							<div className="stat-val">Instant</div>
							<div className="stat-label">QR Scanning</div>
						</div>
					</div>
				</div>

				<div className="col-6 col-md-3">
					<div className="stat-card">
						<div className="stat-icon-wrapper stat-icon-emerald">
							<FaUserCheck />
						</div>
						<div>
							<div className="stat-val">AI Face</div>
							<div className="stat-label">Biometric Verification</div>
						</div>
					</div>
				</div>

				<div className="col-6 col-md-3">
					<div className="stat-card">
						<div className="stat-icon-wrapper stat-icon-cyan">
							<FaShieldAlt />
						</div>
						<div>
							<div className="stat-val">24 / 7</div>
							<div className="stat-label">Gate Security</div>
						</div>
					</div>
				</div>

				<div className="col-6 col-md-3">
					<div className="stat-card">
						<div className="stat-icon-wrapper stat-icon-rose">
							<FaCheckCircle />
						</div>
						<div>
							<div className="stat-val">Brevo</div>
							<div className="stat-label">Email Verified</div>
						</div>
					</div>
				</div>
			</div>

			{/* Attendance Modes */}
			<div className="mb-5">
				<div className="d-flex align-items-center justify-content-between mb-3">
					<div>
						<h3 className="m-0 text-dark">Dual Attendance Methods</h3>
						<p className="text-muted small m-0">Fast, secure check-ins designed for high peak-hour throughput</p>
					</div>
				</div>

				<div className="row g-4">
					<div className="col-md-6">
						<div className="card h-100 border-0 shadow-sm hover-lift">
							<div className="card-body p-4">
								<div className="d-flex align-items-start gap-3">
									<div className="stat-icon-wrapper stat-icon-blue fs-3">
										<FaQrcode />
									</div>
									<div>
										<h4 className="h5 fw-bold mb-2">1. QR Code Digital Gate Pass</h4>
										<p className="text-muted mb-3">
											Every registered student gets a unique, encrypted QR code generated instantly in their dashboard. Guards scan it with mobile or desktop webcams for instantaneous entry/exit recording.
										</p>
										<span className="badge bg-primary-subtle text-primary fw-bold">Zero-contact scanning</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="col-md-6">
						<div className="card h-100 border-0 shadow-sm hover-lift">
							<div className="card-body p-4">
								<div className="d-flex align-items-start gap-3">
									<div className="stat-icon-wrapper stat-icon-emerald fs-3">
										<FaUserCheck />
									</div>
									<div>
										<h4 className="h5 fw-bold mb-2">2. AI Face Recognition Verification</h4>
										<p className="text-muted mb-3">
											Students register their facial landmark profile once. Guard cameras can automatically match live camera frames with student face descriptors, allowing effortless hands-free attendance.
										</p>
										<span className="badge bg-success-subtle text-success fw-bold">Biometric precision</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Interactive Callback Form & Workflow */}
			<div className="row g-4 mb-5">
				<div className="col-lg-6">
					<div className="card h-100">
						<div className="card-body p-4">
							<div className="d-flex align-items-center gap-2 mb-2">
								<FaPhoneAlt className="text-primary" />
								<h3 className="h5 fw-bold m-0">Need Assistance? Request a Callback</h3>
							</div>
							<p className="text-muted small mb-4">
								Enter your details below and our hostel warden / administration team will contact you.
							</p>

							{cbError ? <div className="alert alert-warning py-2 small">{cbError}</div> : null}
							{cbSuccess ? <div className="alert alert-success py-2 small">{cbSuccess}</div> : null}

							<form onSubmit={submitCallbackRequest}>
								<div className="mb-3">
									<label className="form-label fw-semibold small">Full Name</label>
									<input
										className="form-control"
										value={cbName}
										onChange={(e) => setCbName(e.target.value)}
										placeholder="e.g. Rahul Sharma"
										required
										disabled={cbLoading}
									/>
								</div>

								<div className="mb-3">
									<label className="form-label fw-semibold small">10-Digit Mobile Number</label>
									<input
										type="tel"
										className="form-control"
										value={cbMobile}
										onChange={(e) => setCbMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
										placeholder="e.g. 9876543210"
										required
										disabled={cbLoading}
										inputMode="numeric"
										pattern="[0-9]{10}"
									/>
									<div className="form-text small">We will call this number regarding hostel entry rules or setup.</div>
								</div>

								<button className="btn btn-primary w-100" disabled={cbLoading}>
									{cbLoading ? 'Submitting Request…' : 'Submit Callback Request'}
								</button>
							</form>
						</div>
					</div>
				</div>

				<div className="col-lg-6">
					<div className="card h-100">
						<div className="card-body p-4">
							<h3 className="h5 fw-bold mb-3">How HostelQR Works</h3>
							<div className="text-muted small mb-3">
								Simple 4-step workflow for hostel residents and security officers.
							</div>

							<div className="d-flex flex-column gap-3">
								<div className="d-flex align-items-start gap-3 p-2 rounded bg-light">
									<span className="badge bg-primary text-white rounded-circle p-2" style={{ width: 28, height: 28 }}>1</span>
									<div>
										<strong className="text-dark">Student Signup &amp; Brevo Verification</strong>
										<div className="text-muted small">Register with your roll number and verify your account via Brevo transactional email.</div>
									</div>
								</div>

								<div className="d-flex align-items-start gap-3 p-2 rounded bg-light">
									<span className="badge bg-primary text-white rounded-circle p-2" style={{ width: 28, height: 28 }}>2</span>
									<div>
										<strong className="text-dark">Digital QR &amp; Face Profile Setup</strong>
										<div className="text-muted small">Access your personal QR gate pass or upload your face biometric template in 1-click.</div>
									</div>
								</div>

								<div className="d-flex align-items-start gap-3 p-2 rounded bg-light">
									<span className="badge bg-primary text-white rounded-circle p-2" style={{ width: 28, height: 28 }}>3</span>
									<div>
										<strong className="text-dark">Gate Officer Scan</strong>
										<div className="text-muted small">Present your phone or digital ID card at the hostel gate for guard scan.</div>
									</div>
								</div>

								<div className="d-flex align-items-start gap-3 p-2 rounded bg-light">
									<span className="badge bg-primary text-white rounded-circle p-2" style={{ width: 28, height: 28 }}>4</span>
									<div>
										<strong className="text-dark">Real-Time Timestamp &amp; Logs</strong>
										<div className="text-muted small">System logs exact IN/OUT session times and updates live hostel occupancy counters.</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Inspiring Quotes */}
			<div className="mb-4">
				<h4 className="fw-bold mb-3 text-center">Hostel Discipline &amp; Values</h4>
				<div className="row g-3">
					<div className="col-md-4">
						<div className="card h-100 text-center p-3">
							<div className="card-body">
								<blockquote className="blockquote mb-0 fs-6 italic text-muted">
									“Punctuality and attendance build the foundation of academic excellence.”
								</blockquote>
							</div>
						</div>
					</div>
					<div className="col-md-4">
						<div className="card h-100 text-center p-3">
							<div className="card-body">
								<blockquote className="blockquote mb-0 fs-6 italic text-muted">
									“Consistency in small daily check-ins leads to big lifetime success.”
								</blockquote>
							</div>
						</div>
					</div>
					<div className="col-md-4">
						<div className="card h-100 text-center p-3">
							<div className="card-body">
								<blockquote className="blockquote mb-0 fs-6 italic text-muted">
									“Safety, discipline, and accountability make campus life empowering.”
								</blockquote>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
