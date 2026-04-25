import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { api } from '../api/axios';
import { clearAuth } from '../api/authStorage';

function getErrorMessage(err) {
	return (
		err?.response?.data?.message ||
		err?.response?.data?.error ||
		err?.message ||
		'Something went wrong'
	);
}

function formatDateTime(value) {
	if (!value) return '-';
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return '-';
	return d.toLocaleString();
}

function getSessionRowsFromLogs(logs) {
	const rows = [];
	for (const log of logs || []) {
		const sessions =
			Array.isArray(log.sessions) && log.sessions.length
				? log.sessions
				: log.inTime || log.outTime
					? [{ inTime: log.inTime || null, outTime: log.outTime || null }]
					: [];

		for (let i = 0; i < sessions.length; i += 1) {
			const s = sessions[i] || {};
			rows.push({
				key: `${log._id}:${i}`,
				date: log.date,
				inTime: s.inTime || null,
				outTime: s.outTime || null,
			});
		}
	}
	return rows;
}

export default function AttendanceHistory() {
	const navigate = useNavigate();
	const [logs, setLogs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const rows = useMemo(() => getSessionRowsFromLogs(logs), [logs]);

	function logout() {
		clearAuth();
		navigate('/login', { replace: true });
	}

	useEffect(() => {
		let alive = true;

		async function load() {
			setError('');
			setLoading(true);
			try {
				const res = await api.get('/attendance/me');
				if (!alive) return;
				setLogs(res.data?.logs || []);
			} catch (err) {
				if (!alive) return;
				setError(getErrorMessage(err));
			} finally {
				if (alive) setLoading(false);
			}
		}

		load();
		return () => {
			alive = false;
		};
	}, []);

	return (
		<div className="page py-4">
			<div className="d-flex justify-content-between align-items-center mb-3">
				<h3 className="m-0">Attendance History</h3>
				<div className="d-flex gap-2">
					<Link to="/dashboard" className="btn btn-outline-secondary btn-sm">
						Back
					</Link>
					<button className="btn btn-outline-danger btn-sm" onClick={logout}>
						Logout
					</button>
				</div>
			</div>

			{error ? <div className="alert alert-danger">{error}</div> : null}

			<div className="card">
				<div className="card-body">
					{loading ? (
						<div>Loading…</div>
					) : rows.length ? (
						<div className="table-responsive">
							<table className="table table-striped align-middle">
								<thead>
									<tr>
										<th>Date</th>
										<th>IN Time</th>
										<th>OUT Time</th>
									</tr>
								</thead>
								<tbody>
									{rows.map((row) => (
										<tr key={row.key}>
											<td>{row.date}</td>
											<td>{formatDateTime(row.inTime)}</td>
											<td>{formatDateTime(row.outTime)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<div className="text-muted">No attendance records yet.</div>
					)}
				</div>
			</div>
		</div>
	);
}
