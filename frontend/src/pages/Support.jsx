import React, { useState } from 'react';
import { FaHeadset, FaEnvelope, FaPhoneAlt, FaPaperPlane, FaCheckCircle } from 'react-icons/fa';

export default function Support() {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [subject, setSubject] = useState('');
	const [message, setMessage] = useState('');
	const [sent, setSent] = useState(false);

	function handleSubmit(e) {
		e.preventDefault();
		setSent(true);
	}

	return (
		<div className="page py-5">
			<div className="text-center mb-5">
				<div className="stat-icon-wrapper stat-icon-cyan mx-auto mb-2" style={{ width: 56, height: 56, fontSize: '1.5rem' }}>
					<FaHeadset />
				</div>
				<h1 className="h2 fw-bold text-dark mb-2">Hostel Support &amp; Ticket Center</h1>
				<p className="text-muted">Get technical help with email verification, QR gate passes, or biometric face registration</p>
			</div>

			<div className="row g-4 mb-4">
				<div className="col-md-6">
					<div className="card h-100 p-3">
						<div className="card-body">
							<div className="d-flex align-items-center gap-3 mb-3">
								<div className="stat-icon-wrapper stat-icon-blue" style={{ width: 44, height: 44, fontSize: '1.2rem' }}>
									<FaEnvelope />
								</div>
								<div>
									<h3 className="h6 fw-bold m-0">Official Email Support</h3>
									<div className="text-muted small">Send your queries or email verification requests</div>
								</div>
							</div>

							<div className="bg-light p-3 rounded">
								<div className="mb-2">
									<strong className="small text-dark">Primary Email:</strong><br />
									<a href="mailto:raviprajapati8545@gmail.com" className="text-primary fw-bold small text-decoration-none">
										raviprajapati8545@gmail.com
									</a>
								</div>
								<div>
									<strong className="small text-dark">Warden Support:</strong><br />
									<a href="mailto:anupamprajapati2337583@gmail.com" className="text-primary fw-bold small text-decoration-none">
										anupamprajapati2337583@gmail.com
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="col-md-6">
					<div className="card h-100 p-3">
						<div className="card-body">
							<div className="d-flex align-items-center gap-3 mb-3">
								<div className="stat-icon-wrapper stat-icon-emerald" style={{ width: 44, height: 44, fontSize: '1.2rem' }}>
									<FaPhoneAlt />
								</div>
								<div>
									<h3 className="h6 fw-bold m-0">Gate Security Helpline</h3>
									<div className="text-muted small">Instant assistance for gate pass entry/exit issues</div>
								</div>
							</div>

							<div className="bg-light p-3 rounded">
								<div className="mb-2">
									<strong className="small text-dark">Security Guard Desk:</strong><br />
									<a href="tel:8765685890" className="text-primary fw-bold small text-decoration-none">
										+91 8765685890
									</a>
								</div>
								<div>
									<strong className="small text-dark">Warden Hotline:</strong><br />
									<a href="tel:9451962435" className="text-primary fw-bold small text-decoration-none">
										+91 9451962435
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Support Ticket Simulation Form */}
			<div className="card border-0 shadow-sm p-4">
				<div className="card-body">
					<h3 className="h5 fw-bold mb-3">Send Us a Direct Support Message</h3>

					{sent ? (
						<div className="alert alert-success p-4 text-center">
							<FaCheckCircle className="display-5 text-success mb-2" />
							<h4 className="fw-bold">Support Ticket Received!</h4>
							<p className="text-muted mb-0">Our hostel administration will reply to <strong>{email}</strong> shortly.</p>
						</div>
					) : (
						<form onSubmit={handleSubmit}>
							<div className="row g-3">
								<div className="col-md-6">
									<label className="form-label small fw-bold">Your Full Name</label>
									<input
										className="form-control"
										placeholder="e.g. Rahul Sharma"
										value={name}
										onChange={(e) => setName(e.target.value)}
										required
									/>
								</div>
								<div className="col-md-6">
									<label className="form-label small fw-bold">Email Address</label>
									<input
										type="email"
										className="form-control"
										placeholder="student@gmail.com"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
									/>
								</div>
								<div className="col-12">
									<label className="form-label small fw-bold">Subject / Issue Type</label>
									<input
										className="form-control"
										placeholder="e.g. Brevo verification link not received / QR code scan error"
										value={subject}
										onChange={(e) => setSubject(e.target.value)}
										required
									/>
								</div>
								<div className="col-12">
									<label className="form-label small fw-bold">Message Details</label>
									<textarea
										className="form-control"
										rows={4}
										placeholder="Describe your issue in detail..."
										value={message}
										onChange={(e) => setMessage(e.target.value)}
										required
									/>
								</div>
							</div>
							<button className="btn btn-primary mt-4 fw-bold d-inline-flex align-items-center gap-2">
								<FaPaperPlane /> Submit Ticket
							</button>
						</form>
					)}
				</div>
			</div>
		</div>
	);
}
