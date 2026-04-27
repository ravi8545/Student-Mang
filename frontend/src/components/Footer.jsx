import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

export default function Footer() {
	const year = new Date().getFullYear();
	return (
		<footer className="public-footer mt-auto">
			<div className="container py-4">
				<div className="row g-4">
					<div className="col-lg-4">
						<div className="fw-semibold fs-5">HostelQR</div>
						<div className="text-muted mt-2">
							Smart QR + Face Recognition based hostel entry and exit management system
						</div>
						<div className="footer-social mt-3" aria-label="Social links">
							<a
								className="social-icon"
								href="https://facebook.com"
								target="_blank"
								rel="noreferrer"
								aria-label="Facebook"
								title="Facebook"
							>
								<FaFacebookF />
							</a>
							<a
								className="social-icon"
								href="https://instagram.com"
								target="_blank"
								rel="noreferrer"
								aria-label="Instagram"
								title="Instagram"
							>
								<FaInstagram />
							</a>
							<a
								className="social-icon"
								href="https://x.com"
								target="_blank"
								rel="noreferrer"
								aria-label="X (Twitter)"
								title="X (Twitter)"
							>
								<FaXTwitter />
							</a>
							<a
								className="social-icon"
								href="https://linkedin.com"
								target="_blank"
								rel="noreferrer"
								aria-label="LinkedIn"
								title="LinkedIn"
							>
								<FaLinkedinIn />
							</a>
						</div>
					</div>

					<div className="col-6 col-lg-4">
						<div className="fw-semibold mb-2">Quick Links</div>
						<div className="d-flex flex-column gap-1">
							<Link className="footer-link" to="/">
								Home
							</Link>
							<Link className="footer-link" to="/about">
								About
							</Link>
							<Link className="footer-link" to="/help">
								Help
							</Link>
							<Link className="footer-link" to="/support">
								Support
							</Link>
						</div>
					</div>

					<div className="col-6 col-lg-4">
						<div className="fw-semibold mb-2">Contact</div>
						<div className="text-muted">
							<div>
								Email:{' '}
								<a className="footer-link" href="mailto:raviprajapati8545@gmail.com">
									raviprajapati8545@gmail.com
								</a>
							</div>
							<div className="mt-1">
								Phone:{' '}
								<a className="footer-link" href="tel:8765685890">
									8765685890
								</a>
							</div>
						</div>
					</div>
				</div>

				<div className="footer-divider my-4" />

				<div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
					<div className="text-muted small">© {year} HostelQR. All rights reserved.</div>
					<div className="text-muted small">Built for secure hostel entry/exit tracking.</div>
				</div>
			</div>
		</footer>
	);
}
