import React, { useId, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FaQrcode, FaShieldAlt, FaUser } from 'react-icons/fa';
import { getAuth } from '../api/authStorage.js';

export default function PublicNavbar() {
	const [open, setOpen] = useState(false);
	const collapseId = useId();
	const auth = getAuth();

	function closeMenu() {
		setOpen(false);
	}

	return (
		<nav className="navbar navbar-expand-lg public-nav py-2" data-bs-theme="light">
			<div className="container">
				<Link className="navbar-brand d-flex align-items-center gap-2" to="/" onClick={closeMenu}>
					<div className="nav-brand-icon">
						<FaQrcode />
					</div>
					<div>
						<span className="fw-extrabold text-dark brand-title" style={{ fontSize: '1.25rem' }}>HostelQR</span>
						<span className="badge bg-primary-subtle text-primary border border-primary-subtle ms-2" style={{ fontSize: '0.65rem' }}>VBSPU</span>
					</div>
				</Link>

				<button
					className="navbar-toggler border-0 shadow-none"
					type="button"
					onClick={() => setOpen((v) => !v)}
					aria-controls={collapseId}
					aria-expanded={open}
					aria-label="Toggle navigation"
				>
					<span className="navbar-toggler-icon" />
				</button>

				<div
					id={collapseId}
					className={`collapse navbar-collapse ${open ? 'show' : ''}`}
				>
					<ul className="navbar-nav mx-auto mb-2 mb-lg-0">
						<li className="nav-item">
							<NavLink className="nav-link" to="/" end onClick={closeMenu}>
								Home
							</NavLink>
						</li>
						<li className="nav-item">
							<NavLink className="nav-link" to="/about" onClick={closeMenu}>
								About
							</NavLink>
						</li>
						<li className="nav-item">
							<NavLink className="nav-link" to="/help" onClick={closeMenu}>
								Help
							</NavLink>
						</li>
						<li className="nav-item">
							<NavLink className="nav-link" to="/support" onClick={closeMenu}>
								Support
							</NavLink>
						</li>
					</ul>

					<div className="d-flex align-items-center gap-2">
						{auth?.token && auth?.role === 'student' ? (
							<NavLink
								className="btn btn-primary btn-sm d-flex align-items-center gap-2"
								to="/student/dashboard"
								onClick={closeMenu}
							>
								<FaUser /> My Dashboard
							</NavLink>
						) : auth?.token && auth?.role === 'admin' ? (
							<NavLink
								className="btn btn-primary btn-sm d-flex align-items-center gap-2"
								to="/admin/dashboard"
								onClick={closeMenu}
							>
								<FaShieldAlt /> Guard Console
							</NavLink>
						) : (
							<>
								<NavLink
									className="btn btn-outline-primary btn-sm"
									to="/login"
									onClick={closeMenu}
								>
									Student Login
								</NavLink>
								<NavLink
									className="btn btn-primary btn-sm"
									to="/signup"
									onClick={closeMenu}
								>
									Student Signup
								</NavLink>
								<NavLink
									className="btn btn-dark btn-sm ms-1 d-flex align-items-center gap-1"
									to="/admin/login"
									onClick={closeMenu}
									style={{ fontSize: '0.8rem' }}
								>
									<FaShieldAlt /> Guard Login
								</NavLink>
							</>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
}
