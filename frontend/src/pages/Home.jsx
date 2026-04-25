import React, { useMemo, useState } from 'react';

import bannerUrl from '../assets/university.jpg';

function isValidIndianMobile(value) {
	const v = String(value || '').trim();
	return /^[0-9]{10}$/.test(v);
}

export default function Home() {
	const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
	const endpoint = useMemo(() => 'https://api.web3forms.com/submit', []);

	const [cbName, setCbName] = useState('');
	const [cbMobile, setCbMobile] = useState('');
	const [cbLoading, setCbLoading] = useState(false);
	const [cbError, setCbError] = useState('');
	const [cbSuccess, setCbSuccess] = useState('');

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
			<div className="card hero-card overflow-hidden">
				<div className="row g-0 align-items-stretch">
					<div className="col-lg-6 p-4 p-lg-5 d-flex flex-column justify-content-center">
						<div className="text-primary fw-semibold">HostelQR</div>
						<h1 className="mt-2 mb-3 hero-title">
							Veer Bahadur Singh Purvanchal University
						</h1>
						<p className="lead mb-2">QR Based Hostel Entry Exit System</p>
						<p className="text-muted mb-0">
							A secure and paperless way to manage hostel entry and exit using unique QR codes.
						</p>
					</div>
					<div className="col-lg-6 hero-media">
						<img
							src={bannerUrl}
							alt="University banner"
							className="w-100 h-100"
							style={{ objectFit: 'cover' }}
						/>
					</div>
				</div>
			</div>

			<div className="row g-3 mt-1">
				<div className="col-lg-6">
					<div className="card h-100">
						<div className="card-body">
							<h3 className="mb-2">Request a Callback</h3>
							<div className="text-muted mb-3">
								Share your details and we’ll contact you.
							</div>

							{cbError ? <div className="alert alert-warning">{cbError}</div> : null}
							{cbSuccess ? <div className="alert alert-success">{cbSuccess}</div> : null}

							<form onSubmit={submitCallbackRequest}>
								<div className="mb-3">
									<label className="form-label">Name</label>
									<input
										className="form-control"
										value={cbName}
										onChange={(e) => setCbName(e.target.value)}
										required
										disabled={cbLoading}
									/>
								</div>

								<div className="mb-3">
									<label className="form-label">Mobile Number</label>
									<input
										type="tel"
										className="form-control"
										value={cbMobile}
										onChange={(e) => setCbMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
										placeholder="10-digit mobile number"
										required
										disabled={cbLoading}
										inputMode="numeric"
										pattern="[0-9]{10}"
									/>
									<div className="form-text">Example: 9876543210</div>
								</div>

								<button className="btn btn-primary" disabled={cbLoading}>
									{cbLoading ? 'Submitting…' : 'Submit'}
								</button>
							</form>
						</div>
					</div>
				</div>

				<div className="col-lg-6">
					<div className="card h-100">
						<div className="card-body">
							<h3 className="mb-2">How it works</h3>
							<div className="text-muted mb-3">
								Simple workflow for students and guards.
							</div>
							<ol className="mb-0">
								<li>Student signs up and receives a unique QR code.</li>
								<li>Guard scans QR at the hostel gate.</li>
								<li>System marks IN/OUT timestamps automatically.</li>
								<li>Attendance history is available in the dashboard.</li>
							</ol>
						</div>
					</div>
				</div>
			</div>

			<div className="mt-4">
				<h3 className="mb-3">Features</h3>
				<div className="row g-3">
					<div className="col-md-4">
						<div className="card h-100">
							<div className="card-body">
								<div className="fw-semibold">Unique QR per Student</div>
								<div className="text-muted mt-2">
									Each student gets a unique QR to verify identity at the gate.
								</div>
							</div>
						</div>
					</div>
					<div className="col-md-4">
						<div className="card h-100">
							<div className="card-body">
								<div className="fw-semibold">Fast Scanning (Camera)</div>
								<div className="text-muted mt-2">
									Guards can scan QR codes using the device camera for quick entry/exit.
								</div>
							</div>
						</div>
					</div>
					<div className="col-md-4">
						<div className="card h-100">
							<div className="card-body">
								<div className="fw-semibold">IN/OUT History</div>
								<div className="text-muted mt-2">
									View attendance history anytime from the student dashboard.
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
