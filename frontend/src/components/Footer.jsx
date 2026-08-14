import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaQrcode } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

export default function Footer() {
	const year = new Date().getFullYear();
	return (
		<footer className="public-footer mt-auto">
			<div className="container py-4">
				<div className="row g-4">
					<div className="col-lg-5">
						<div className="d-flex align-items-center gap-2 mb-2">
							<div className="nav-brand-icon" style={{ width: 32, height: 32, fontSize: '1rem' }}>
								<FaQrcode />
							</div>
							<span className="fw-extrabold brand-title fs-5 text-dark">HostelQR</span>
						</div>
						<p className="text-muted small mb-3 style-desc" style={{ maxWidth: 360 }}>
							Veer Bahadur Singh Purvanchal University smart hostel attendance &amp; entry-exit portal with QR Code and AI Face Verification.
						</p>
						<div className="footer-social d-flex gap-2" aria-label="Social links">
							<a className="social-icon" href="https://facebook.com" target="_blank" rel="noreferrer" title="Facebook">
								<FaFacebookF />
							</a>
							<a className="social-icon" href="https://instagram.com" target="_blank" rel="noreferrer" title="Instagram">
								<FaInstagram />
							</a>
							<a className="social-icon" href="https://x.com" target="_blank" rel="noreferrer" title="X (Twitter)">
								<FaXTwitter />
							</a>
							<a className="social-icon" href="https://linkedin.com" target="_blank" rel="noreferrer" title="LinkedIn">
								<FaLinkedinIn />
							</a>
						</div>
					</div>

					<div className="col-6 col-lg-3">
						<div className="fw-bold mb-3 text-dark">Quick Navigation</div>
						<div className="d-flex flex-column gap-2">
							<Link className="footer-link" to="/">Home Portal</Link>
							<Link className="footer-link" to="/about">About University System</Link>
							<Link className="footer-link" to="/help">Help &amp; FAQ</Link>
							<Link className="footer-link" to="/support">Contact Support</Link>
						</div>
					</div>

					<div className="col-6 col-lg-4">
						<div className="fw-bold mb-3 text-dark">Hostel Gate Control</div>
						<div className="text-muted small">
							<div className="mb-2">
								<strong className="text-dark">Official Email:</strong>{' '}
								<a className="footer-link text-primary" href="mailto:raviprajapati8545@gmail.com">
									raviprajapati8545@gmail.com
								</a>
							</div>
							<div className="mb-2">
								<strong className="text-dark">Emergency Helpline:</strong>{' '}
								<a className="footer-link text-primary" href="tel:8765685890">
									+91 8765685890
								</a>
							</div>
							<div>
								<strong className="text-dark">Location:</strong> VBSPU Campus, Jaunpur, Uttar Pradesh
							</div>
						</div>
					</div>
				</div>

				<div className="border-top my-4" style={{ borderColor: 'var(--slate-200)' }} />

				<div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
					<div className="text-muted small">© {year} HostelQR VBSPU. Powered by Brevo Email Verification &amp; AI Vision.</div>
					<div className="text-muted small">Designed for safe and seamless student movement tracking.</div>
				</div>
			</div>
		</footer>
	);
}
