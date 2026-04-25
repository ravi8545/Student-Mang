import React from 'react';

export default function Support() {
	return (
		<div className="page py-4">
			<div className="card">
				<div className="card-body">
					<h3 className="mb-3">Support</h3>
					<p className="mb-3">
						If you face issues with signup, login, QR code display, or scanning at the
						gate, contact the support team.
					</p>

					<div className="row g-3">
						<div className="col-md-6">
							<div className="p-3 rounded border bg-body">
								<div className="fw-semibold">Email Support</div>
								<div className="text-muted">
									<a href="mailto:raviprajapati8545@gmail.com">raviprajapati8545@gmail.com</a>
								</div>
							</div>
						</div>
						<div className="col-md-6">
							<div className="p-3 rounded border bg-body">
								<div className="fw-semibold">Phone Support</div>
								<div className="text-muted">
									<a href="tel:8765685890">8765685890</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
