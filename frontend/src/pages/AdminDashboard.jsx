import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from 'qr-scanner';
import qrScannerWorkerUrl from 'qr-scanner/qr-scanner-worker.min.js?url';

import { api } from '../api/axios';
import { clearAuth } from '../api/authStorage';

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

export default function AdminDashboard() {
	const navigate = useNavigate();

	const videoRef = useRef(null);
	const scannerRef = useRef(null);
	const processingRef = useRef(false);
	const cooldownUntilRef = useRef(0);

	const [scannerStatus, setScannerStatus] = useState('starting');
	const [scanInfo, setScanInfo] = useState(null);
	const [scanError, setScanError] = useState('');

	const [students, setStudents] = useState([]);
	const [attendance, setAttendance] = useState([]);

	const [loadingStudents, setLoadingStudents] = useState(true);
	const [loadingAttendance, setLoadingAttendance] = useState(true);
	const [loadingRefresh, setLoadingRefresh] = useState(false);
	const [error, setError] = useState('');

	function logout() {
		clearAuth();
		navigate('/admin/login', { replace: true });
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
	}, [refreshAll]);

	return (
		<div className="page">
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
						<div className="card-header d-flex justify-content-between align-items-center">
							<span>QR Scanner</span>
							<span className="badge text-bg-secondary">{scannerStatus}</span>
						</div>
						<div className="card-body">
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
							) : attendance.length ? (
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
											{attendance.map((log) => (
												<tr key={log._id}>
													<td>{log.date}</td>
													<td>{log.studentId?.name || '-'}</td>
													<td>{log.studentId?.rollNo || '-'}</td>
													<td>{formatDateTime(log.inTime)}</td>
													<td>{formatDateTime(log.outTime)}</td>
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
