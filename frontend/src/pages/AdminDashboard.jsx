import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from 'qr-scanner';
import qrScannerWorkerUrl from 'qr-scanner/qr-scanner-worker.min.js?url';

import { api } from '../api/axios';
import { clearAuth } from '../api/authStorage';
import FaceVerificationPanel from '../components/FaceVerificationPanel.jsx';

// Configure qr-scanner worker path for Vite.
QrScanner.WORKER_PATH = qrScannerWorkerUrl;

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

function getSessionRowsFromAdminLogs(logs) {
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
				name: log.studentId?.name || '-',
				rollNo: log.studentId?.rollNo || '-',
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

export default function AdminDashboard() {
	const navigate = useNavigate();

	const videoRef = useRef(null);
	const scannerRef = useRef(null);
	const processingRef = useRef(false);
	const cooldownUntilRef = useRef(0);
	const [scanMode, setScanMode] = useState('qr');

	const [scannerStatus, setScannerStatus] = useState('starting');
	const [scanInfo, setScanInfo] = useState(null);
	const [scanError, setScanError] = useState('');

	const [students, setStudents] = useState([]);
	const [attendance, setAttendance] = useState([]);
	const attendanceRows = useMemo(
		() => getSessionRowsFromAdminLogs(attendance),
		[attendance]
	);

	const [loadingStudents, setLoadingStudents] = useState(true);
	const [loadingAttendance, setLoadingAttendance] = useState(true);
	const [loadingRefresh, setLoadingRefresh] = useState(false);
	const [error, setError] = useState('');

	function logout() {
		clearAuth();
		navigate('/admin', { replace: true });
	}

	const refreshAll = useCallback(async () => {
		setError('');
		setLoadingRefresh(true);

		try {
			const [studentsRes, attendanceRes] = await Promise.all([
				api.get('/admin/students'),
				api.get('/admin/attendance'),
			]);

			setStudents(studentsRes.data?.students || []);
			setAttendance(attendanceRes.data?.logs || []);
		} catch (err) {
			setError(getErrorMessage(err));
		} finally {
			setLoadingStudents(false);
			setLoadingAttendance(false);
			setLoadingRefresh(false);
		}
	}, []);

	useEffect(() => {
		refreshAll();
	}, [refreshAll]);

	useEffect(() => {
		if (scanMode !== 'qr') return undefined;

		const videoEl = videoRef.current;
		if (!videoEl) return;

		// Create a camera-based scanner for guards/admin.
		const scanner = new QrScanner(
			videoEl,
			async (result) => {
				const now = Date.now();
				if (now < cooldownUntilRef.current) return;
				if (processingRef.current) return;

				const qrText = typeof result === 'string' ? result : result?.data;
				if (!qrText) return;

				processingRef.current = true;
				setScanError('');
				setScanInfo({ status: 'processing', qrText });

				try {
					const res = await api.post('/attendance/scan', { qrText });
					setScanInfo({ status: 'done', ...res.data });
					await refreshAll();
				} catch (err) {
					setScanError(getErrorMessage(err));
					setScanInfo(null);
				} finally {
					// Cooldown prevents rapid repeated scans firing multiple times.
					cooldownUntilRef.current = Date.now() + 2500;
					processingRef.current = false;
				}
			},
			{
				preferredCamera: 'environment',
				highlightScanRegion: true,
				highlightCodeOutline: true,
				returnDetailedScanResult: true,
			}
		);

		scannerRef.current = scanner;

		scanner
			.start()
			.then(() => setScannerStatus('running'))
			.catch((err) => {
				setScannerStatus('error');
				setScanError(
					'Camera access failed. Please allow camera permission and reload the page.'
				);
				console.warn('Scanner start failed:', err);
			});

		return () => {
			scannerRef.current = null;
			try {
				scanner.stop();
				scanner.destroy();
			} catch {
				// ignore cleanup errors
			}
		};
	}, [refreshAll, scanMode]);

	return (
		<div className="page py-4">
			<div className="d-flex justify-content-between align-items-center mb-3">
				<h3 className="m-0">Guard/Admin Dashboard</h3>
				<div className="d-flex gap-2">
					<button
						className="btn btn-outline-primary btn-sm"
						onClick={refreshAll}
						disabled={loadingRefresh}
					>
						{loadingRefresh ? 'Refreshing…' : 'Refresh'}
					</button>
					<button className="btn btn-outline-danger btn-sm" onClick={logout}>
						Logout
					</button>
				</div>
			</div>

			{error ? <div className="alert alert-danger">{error}</div> : null}

			<div className="row g-3">
				<div className="col-lg-5">
					<div className="card">
						<div className="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">
							<div className="btn-group btn-group-sm scan-mode-toggle" role="group" aria-label="Scan mode">
								<button
									type="button"
									className={`btn ${scanMode === 'qr' ? 'btn-primary' : 'btn-outline-primary'}`}
									onClick={() => setScanMode('qr')}
								>
									Scan QR
								</button>
								<button
									type="button"
									className={`btn ${scanMode === 'face' ? 'btn-primary' : 'btn-outline-primary'}`}
									onClick={() => setScanMode('face')}
								>
									Scan Face
								</button>
							</div>
							<span className="badge text-bg-secondary">
								{scanMode === 'qr' ? scannerStatus : 'face mode'}
							</span>
						</div>
						<div className="card-body">
							{scanMode === 'qr' ? (
								<>
									<div className="ratio ratio-4x3">
										<video
											ref={videoRef}
											style={{ width: '100%', height: '100%', objectFit: 'cover' }}
											muted
											playsInline
										/>
									</div>

									{scanError ? (
										<div className="alert alert-warning mt-3 mb-0">{scanError}</div>
									) : null}

									{scanInfo?.status === 'processing' ? (
										<div className="alert alert-info mt-3 mb-0">Processing scan…</div>
									) : null}

									{scanInfo?.status === 'done' ? (
										<div className="alert alert-success mt-3 mb-0">
											<div>
												<strong>Action:</strong> {scanInfo.action}
											</div>
											{scanInfo.student ? (
												<div>
													<strong>Student:</strong> {scanInfo.student.name} ({scanInfo.student.rollNo})
												</div>
											) : null}
											{scanInfo.attendance ? (
												<div className="mt-1 small">
													IN: {formatDateTime(scanInfo.attendance.inTime)} | OUT:{' '}
													{formatDateTime(scanInfo.attendance.outTime)}
												</div>
											) : null}
											{scanInfo.message ? (
												<div className="mt-1 small text-muted">{scanInfo.message}</div>
											) : null}
										</div>
									) : null}
								</>
							) : (
								<FaceVerificationPanel onAttendanceMarked={refreshAll} />
							)}
						</div>
					</div>
				</div>

				<div className="col-lg-7">
					<div className="card mb-3">
						<div className="card-header">Students (Live IN/OUT)</div>
						<div className="card-body">
							{loadingStudents ? (
								<div>Loading students…</div>
							) : students.length ? (
								<div className="table-responsive">
									<table className="table table-striped align-middle">
										<thead>
											<tr>
												<th>Name</th>
												<th>Roll</th>
												<th>Room</th>
												<th>Hostel</th>
												<th>Status</th>
											</tr>
										</thead>
										<tbody>
											{students.map((s) => (
												<tr key={s._id}>
													<td>{s.name}</td>
													<td>{s.rollNo}</td>
													<td>{s.roomNo}</td>
													<td>{s.hostelName}</td>
													<td>
														<span
															className={
																s.status === 'IN'
																	? 'badge text-bg-success'
																	: 'badge text-bg-secondary'
															}
														>
															{s.status}
														</span>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<div className="text-muted">No students found.</div>
							)}
						</div>
					</div>

					<div className="card">
						<div className="card-header">Attendance Logs (All)</div>
						<div className="card-body">
							{loadingAttendance ? (
								<div>Loading attendance…</div>
							) : attendanceRows.length ? (
								<div className="table-responsive">
									<table className="table table-striped align-middle">
										<thead>
											<tr>
												<th>Date</th>
												<th>Name</th>
												<th>Roll</th>
												<th>IN</th>
												<th>OUT</th>
											</tr>
										</thead>
										<tbody>
											{attendanceRows.map((row) => (
												<tr key={row.key}>
													<td>{row.date}</td>
													<td>{row.name}</td>
													<td>{row.rollNo}</td>
													<td>{formatDateTime(row.inTime)}</td>
													<td>{formatDateTime(row.outTime)}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<div className="text-muted">No attendance logs found.</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
