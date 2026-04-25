import React from 'react';

export default function About() {
	return (
		<div className="page py-4">
			<div className="card">
				<div className="card-body">
					<h3 className="mb-3">About HostelQR</h3>
					<p className="mb-2">
						HostelQR is a QR-based hostel entry/exit system designed to simplify gate
						verification and attendance tracking for hostel residents.
					</p>
					<p className="mb-0 text-muted">
						Each student receives a unique QR code. Guards scan the QR at the gate to
						mark IN/OUT timestamps and maintain a clean, auditable attendance history.
					</p>
				</div>
			</div>
		</div>
	);
}
