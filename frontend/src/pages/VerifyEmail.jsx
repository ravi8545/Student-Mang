import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

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
		<div className="page py-4">
			<h3 className="mb-3">Email Verification</h3>

			<div className="card">
				<div className="card-body">
					{loading ? (
						<div>Verifying…</div>
					) : ok ? (
						<div className="alert alert-success mb-3">Email Verified Successfully</div>
					) : (
						<div className="alert alert-danger mb-3">
							Invalid/Expired Link
							{detail ? <div className="small mt-2">{detail}</div> : null}
						</div>
					)}

					{loading ? null : (
						<Link to="/login" className="btn btn-primary">
							Go to Login
						</Link>
					)}
				</div>
			</div>
		</div>
	);
}
