import React, { useId, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function PublicNavbar() {
	const [open, setOpen] = useState(false);
	const collapseId = useId();

	function closeMenu() {
		setOpen(false);
	}

	return (
		<nav className="navbar navbar-expand-lg public-nav" data-bs-theme="light">
			<div className="container">
				<Link className="navbar-brand fw-semibold" to="/" onClick={closeMenu}>
					HostelQR
				</Link>

				<button
					className="navbar-toggler"
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
					<ul className="navbar-nav me-auto mb-2 mb-lg-0">
						<li className="nav-item">
							<NavLink
								className="nav-link"
								to="/"
								end
								onClick={closeMenu}
							>
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

					<div className="d-flex gap-2">
						<NavLink
							className="btn btn-outline-primary btn-sm"
							to="/login"
							onClick={closeMenu}
						>
							Login
						</NavLink>
						<NavLink
							className="btn btn-primary btn-sm"
							to="/signup"
							onClick={closeMenu}
						>
							Signup
						</NavLink>
					</div>
				</div>
			</div>
		</nav>
	);
}
