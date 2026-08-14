import React, { useState } from 'react';
import { FaQuestionCircle, FaChevronDown, FaChevronUp, FaEnvelope, FaPhoneAlt } from 'react-icons/fa';

export default function Help() {
	const [openIdx, setOpenIdx] = useState(0);

	const faqs = [
		{
			q: 'How do I mark my entry and exit at the hostel gate?',
			a: 'Log into your HostelQR account on your smartphone, navigate to "My Dashboard", and display your QR Code pass to the gate security guard. The guard will scan it using the gate camera to record your IN or OUT timestamp instantly.',
		},
		{
			q: 'Why am I not receiving my verification email?',
			a: 'We send transactional verification emails via Brevo. Please check your Spam or Junk folder. If you still do not see it, go to the Student Login page and click "Resend Brevo Verification Email".',
		},
		{
			q: 'How does Face Recognition attendance work?',
			a: 'In your dashboard, click "Register Face" to capture a 3D biometric descriptor using your device camera. Once registered, guards can verify your entry by matching your live face with your registered profile.',
		},
		{
			q: 'What if camera scanning fails at the gate?',
			a: 'The guard security console includes a "Manual Gate Override" feature. You can provide your roll number to the warden or guard, and they can manually log your IN or OUT status in 1-click.',
		},
		{
			q: 'Can I print or download a physical gate pass badge?',
			a: 'Yes! Click "Digital Gate Pass" in your student dashboard to open your official VBSPU Hostel Resident ID Badge. You can click "Print Pass" or "Download PNG" for offline use.',
		},
	];

	return (
		<div className="page py-5">
			<div className="text-center mb-5">
				<div className="stat-icon-wrapper stat-icon-blue mx-auto mb-2" style={{ width: 56, height: 56, fontSize: '1.5rem' }}>
					<FaQuestionCircle />
				</div>
				<h1 className="h2 fw-bold text-dark mb-2">Help &amp; Frequently Asked Questions</h1>
				<p className="text-muted">Everything you need to know about using HostelQR gate passes and attendance</p>
			</div>

			<div className="row g-4">
				<div className="col-lg-7">
					<div className="card border-0 shadow-sm p-3">
						<div className="card-body">
							<h3 className="h5 fw-bold mb-4">Frequently Asked Questions</h3>

							<div className="d-flex flex-column gap-3">
								{faqs.map((faq, i) => (
									<div key={i} className="border rounded overflow-hidden">
										<button
											className="w-100 p-3 text-start bg-light border-0 d-flex justify-content-between align-items-center fw-bold text-dark"
											onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
										>
											<span>{faq.q}</span>
											{openIdx === i ? <FaChevronUp className="text-primary" /> : <FaChevronDown className="text-muted" />}
										</button>
										{openIdx === i && (
											<div className="p-3 bg-white text-muted small border-top lh-base">
												{faq.a}
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				<div className="col-lg-5">
					<div className="card border-0 shadow-sm p-3">
						<div className="card-body">
							<h3 className="h5 fw-bold mb-3">Direct Support Desk</h3>
							<p className="text-muted small mb-4">Need further help with your hostel registration or QR code?</p>

							<div className="p-3 bg-light rounded mb-3">
								<div className="d-flex align-items-center gap-3">
									<div className="stat-icon-wrapper stat-icon-emerald" style={{ width: 44, height: 44, fontSize: '1.1rem' }}>
										<FaEnvelope />
									</div>
									<div>
										<strong className="text-dark small">Email Support</strong>
										<div>
											<a href="mailto:raviprajapati8545@gmail.com" className="text-primary text-decoration-none fw-bold small">
												raviprajapati8545@gmail.com
											</a>
										</div>
									</div>
								</div>
							</div>

							<div className="p-3 bg-light rounded mb-3">
								<div className="d-flex align-items-center gap-3">
									<div className="stat-icon-wrapper stat-icon-cyan" style={{ width: 44, height: 44, fontSize: '1.1rem' }}>
										<FaPhoneAlt />
									</div>
									<div>
										<strong className="text-dark small">Gate Security Hotline</strong>
										<div>
											<a href="tel:8765685890" className="text-primary text-decoration-none fw-bold small">
												+91 8765685890
											</a>
										</div>
									</div>
								</div>
							</div>

							<div className="form-text small mt-3">
								Support desk hours: Monday – Saturday, 8:00 AM – 8:00 PM IST.
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
