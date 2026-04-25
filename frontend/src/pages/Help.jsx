import React from 'react';

export default function Help() {
	return (
		<div className="page py-4">
			<div className="row g-3">
				<div className="col-lg-7">
					<div className="card h-100">
						<div className="card-body">
							<h3 className="mb-3">Help</h3>
							<ul className="mb-0">
								<li>Sign up with your hostel and department details.</li>
								<li>Verify your email before logging in.</li>
								<li>Open your dashboard to view your QR code.</li>
								<li>Show your QR at the hostel gate to mark IN/OUT.</li>
								<li>Check attendance history anytime from your dashboard.</li>
							</ul>
						</div>
					</div>
				</div>

				<div className="col-lg-5">
					<div className="card h-100">
						<div className="card-body">
							<h3 className="mb-3">Contact</h3>
							<div className="mb-2">
								<strong>Email:</strong>{' '}
								<a href="mailto:raviprajapati8545@gmail.com">raviprajapati8545@gmail.com</a>
							</div>
							<div className="mb-2">
								<strong>Phone:</strong>{' '}
								<a href="tel:8765685890">8765685890</a>
							</div>
							<div className="text-muted small">
								Contact details for help and support.
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
