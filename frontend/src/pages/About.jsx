import React from 'react';
import { FaQrcode, FaUserCheck, FaShieldAlt, FaUniversity, FaEnvelope } from 'react-icons/fa';

export default function About() {
	return (
		<div className="page py-5">
			<div className="card border-0 shadow-sm overflow-hidden mb-4">
				<div className="card-body p-4 p-md-5">
					<div className="d-flex align-items-center gap-2 mb-3">
						<span className="badge bg-primary-subtle text-primary px-3 py-2 fs-6">Official Portal</span>
					</div>
					<h1 className="display-6 fw-extrabold text-dark mb-3">About HostelQR System</h1>
					<p className="lead text-muted mb-4" style={{ maxWidth: 780 }}>
						HostelQR is an automated hostel entry and exit attendance management platform built for Veer Bahadur Singh Purvanchal University (VBSPU). Designed to replace manual register logging with digital QR codes and AI facial biometrics.
					</p>

					<div className="row g-4 mt-2">
						<div className="col-md-4">
							<div className="p-4 rounded bg-light h-100 border">
								<div className="stat-icon-wrapper stat-icon-blue mb-3">
									<FaQrcode />
								</div>
								<h3 className="h5 fw-bold mb-2">Encrypted QR Pass</h3>
								<p className="text-muted small m-0">
									Instant dynamic QR code generation for every student resident. Easily downloadable or printable as a digital gate pass.
								</p>
							</div>
						</div>

						<div className="col-md-4">
							<div className="p-4 rounded bg-light h-100 border">
								<div className="stat-icon-wrapper stat-icon-emerald mb-3">
									<FaUserCheck />
								</div>
								<h3 className="h5 fw-bold mb-2">AI Vision Biometrics</h3>
								<p className="text-muted small m-0">
									Facial landmark verification powered by computer vision. Hands-free attendance verification for guards at peak hostel rush hours.
								</p>
							</div>
						</div>

						<div className="col-md-4">
							<div className="p-4 rounded bg-light h-100 border">
								<div className="stat-icon-wrapper stat-icon-rose mb-3">
									<FaEnvelope />
								</div>
								<h3 className="h5 fw-bold mb-2">Brevo Transactional Email</h3>
								<p className="text-muted small m-0">
									Instant email verification and security alerts delivered reliably through Brevo's cloud infrastructure.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* System Values Card */}
			<div className="card border-0 shadow-sm p-4">
				<div className="card-body">
					<h3 className="h5 fw-bold mb-3 d-flex align-items-center gap-2">
						<FaUniversity className="text-primary" /> University Security Objectives
					</h3>
					<ul className="text-muted mb-0 lh-lg">
						<li><strong>Real-time Occupancy Tracking:</strong> Immediate insight into how many students are inside vs outside the hostel campus.</li>
						<li><strong>Automated Guard Logs:</strong> Prevents proxy attendance and paper log tamperings.</li>
						<li><strong>Parent &amp; Administration Security:</strong> Precise entry/exit timestamps stored in encrypted database logs.</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
