import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHistory, FaArrowLeft, FaSignOutAlt, FaCalendarAlt, FaCheckCircle, FaClock } from 'react-icons/fa';

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
	return d.toLocaleString('en-IN', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: true,
	});
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

	rows.sort((a, b) => {
		const aTime = new Date(a.inTime || a.outTime || 0).getTime();
		const bTime = new Date(b.inTime || b.outTime || 0).getTime();
		return bTime - aTime;
	});

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
			<div className="card p-3 mb-4 border-0 shadow-sm bg-white">
				<div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
					<div className="d-flex align-items-center gap-3">
						<div className="stat-icon-wrapper stat-icon-blue p-2 fs-4">
							<FaHistory />
						</div>
						<div>
							<h3 className="m-0 h5 fw-bold text-dark">Personal Attendance History</h3>
							<div className="text-muted small">Complete record of your hostel gate check-ins and check-outs</div>
						</div>
					</div>

					<div className="d-flex gap-2">
						<Link to="/student/dashboard" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
							<FaArrowLeft /> Back to Dashboard
						</Link>
						<button className="btn btn-danger btn-sm d-flex align-items-center gap-1" onClick={logout}>
							<FaSignOutAlt /> Logout
						</button>
					</div>
				</div>
			</div>

			{error ? <div className="alert alert-danger mb-4">{error}</div> : null}

			<div className="card border-0 shadow-sm">
				<div className="card-header d-flex justify-content-between align-items-center bg-white border-bottom">
					<span className="fw-bold d-flex align-items-center gap-2">
						<FaCalendarAlt className="text-primary" /> Session Activity Log
					</span>
					<span className="badge bg-primary">{rows.length} Total Sessions</span>
				</div>
				<div className="card-body p-0">
					{loading ? (
						<div className="p-4 text-center text-muted">Loading attendance history…</div>
					) : rows.length ? (
						<div className="table-responsive">
							<table className="table table-hover align-middle mb-0">
								<thead className="table-light">
									<tr>
										<th className="ps-4">Date</th>
										<th>IN Timestamp (Entry)</th>
										<th>OUT Timestamp (Exit)</th>
										<th>Gate Status</th>
									</tr>
								</thead>
								<tbody>
									{rows.map((row) => (
										<tr key={row.key}>
											<td className="ps-4 fw-semibold text-dark">{row.date}</td>
											<td>
												{row.inTime ? (
													<span className="text-success fw-bold d-inline-flex align-items-center gap-1">
														<FaCheckCircle className="small" /> {formatDateTime(row.inTime)}
													</span>
												) : (
													'-'
												)}
											</td>
											<td>
												{row.outTime ? (
													<span className="text-danger fw-bold d-inline-flex align-items-center gap-1">
														<FaClock className="small" /> {formatDateTime(row.outTime)}
													</span>
												) : (
													<span className="badge bg-success-subtle text-success fw-bold">Currently IN</span>
												)}
											</td>
											<td>
												{row.inTime && !row.outTime ? (
													<span className="badge text-bg-success">Active Session</span>
												) : (
													<span className="badge text-bg-secondary">Completed</span>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<div className="p-5 text-center text-muted">No attendance activity recorded yet.</div>
					)}
				</div>
			</div>
		</div>
	);
}
