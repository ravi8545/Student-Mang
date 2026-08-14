import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaCheckCircle, FaExclamationTriangle, FaSpinner, FaArrowRight } from 'react-icons/fa';

import { api } from '../api/axios';

function getErrorMessage(err) {
	return (
		err?.response?.data?.message ||
		err?.response?.data?.error ||
		err?.message ||
		'Something went wrong'
	);
}

export default function VerifyEmail() {
	const { token } = useParams();
	const [loading, setLoading] = useState(true);
	const [ok, setOk] = useState(false);
	const [detail, setDetail] = useState('');

	useEffect(() => {
		let alive = true;

		async function run() {
			setLoading(true);
			setOk(false);
			setDetail('');

			try {
				await api.get(`/auth/verify/${token}`);
				if (!alive) return;
				setOk(true);
			} catch (err) {
				if (!alive) return;
				setOk(false);
				setDetail(getErrorMessage(err));
			} finally {
				if (alive) setLoading(false);
			}
		}

		run();
		return () => {
			alive = false;
		};
	}, [token]);

	return (
		<div className="page py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '75vh' }}>
			<div className="card shadow-lg border-0 text-center p-4" style={{ maxWidth: 500, width: '100%' }}>
				<div className="card-body">
					{loading ? (
						<div className="py-4">
							<FaSpinner className="spin text-primary display-4 mb-3" />
							<h3 className="h4 fw-bold">Verifying Brevo Security Token</h3>
							<p className="text-muted small">Please wait while we validate your email verification link…</p>
						</div>
					) : ok ? (
						<div className="py-3">
							<div className="stat-icon-wrapper stat-icon-emerald mx-auto mb-3" style={{ width: 72, height: 72, fontSize: '2.5rem' }}>
								<FaCheckCircle />
							</div>
							<h3 className="h4 fw-bold text-dark mb-2">Account Successfully Verified!</h3>
							<p className="text-muted mb-4">
								Your email address has been verified via Brevo. You can now log into your student dashboard and access your digital gate pass.
							</p>
							<Link to="/login" className="btn btn-primary btn-lg w-100 fw-bold d-inline-flex align-items-center justify-content-center gap-2">
								Proceed to Student Login <FaArrowRight />
							</Link>
						</div>
					) : (
						<div className="py-3">
							<div className="stat-icon-wrapper stat-icon-rose mx-auto mb-3" style={{ width: 72, height: 72, fontSize: '2.5rem' }}>
								<FaExclamationTriangle />
							</div>
							<h3 className="h4 fw-bold text-dark mb-2">Verification Failed or Expired</h3>
							<p className="text-muted small mb-3">
								The email verification token is invalid or has expired (links expire after 24 hours).
							</p>
							{detail ? <div className="alert alert-warning py-2 small mb-4">{detail}</div> : null}

							<Link to="/login" className="btn btn-outline-primary w-100 fw-bold">
								Go to Login &amp; Request Resend
							</Link>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
