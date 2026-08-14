import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from 'qr-scanner';
import qrScannerWorkerUrl from 'qr-scanner/qr-scanner-worker.min.js?url';
import { FaQrcode, FaUserCheck, FaSyncAlt, FaSignOutAlt, FaSearch, FaFilter, FaFileCsv, FaUserPlus, FaCheckCircle, FaTimesCircle, FaShieldAlt } from 'react-icons/fa';

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
	return d.toLocaleString('en-IN', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: true,
	});
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
				hostelName: log.studentId?.hostelName || '-',
				roomNo: log.studentId?.roomNo || '-',
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
	const [stats, setStats] = useState({
		totalStudents: 0,
		totalIn: 0,
		totalOut: 0,
		totalTodayScans: 0,
		occupancyRate: 0,
	});

	// Filter states
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState('ALL');
	const [hostelFilter, setHostelFilter] = useState('ALL');

	// Manual override modal
	const [showManualModal, setShowManualModal] = useState(false);
	const [manualRollNo, setManualRollNo] = useState('');
	const [manualAction, setManualAction] = useState('IN');
	const [manualLoading, setManualLoading] = useState(false);
	const [manualError, setManualError] = useState('');
	const [manualSuccess, setManualSuccess] = useState('');

	const [loadingStudents, setLoadingStudents] = useState(true);
	const [loadingAttendance, setLoadingAttendance] = useState(true);
	const [loadingRefresh, setLoadingRefresh] = useState(false);
	const [error, setError] = useState('');

	const attendanceRows = useMemo(
		() => getSessionRowsFromAdminLogs(attendance),
		[attendance]
	);

	// Extract unique hostels list
	const hostelsList = useMemo(() => {
		const set = new Set();
		students.forEach((s) => {
			if (s.hostelName) set.add(s.hostelName);
		});
		return Array.from(set);
	}, [students]);

	// Filtered students list
	const filteredStudents = useMemo(() => {
		return students.filter((s) => {
			const q = searchQuery.toLowerCase().trim();
			const matchesSearch =
				!q ||
				s.name?.toLowerCase().includes(q) ||
				s.rollNo?.toLowerCase().includes(q) ||
				s.roomNo?.toLowerCase().includes(q) ||
				s.department?.toLowerCase().includes(q);

			const matchesStatus =
				statusFilter === 'ALL' || s.status === statusFilter;

			const matchesHostel =
				hostelFilter === 'ALL' || s.hostelName === hostelFilter;

			return matchesSearch && matchesStatus && matchesHostel;
		});
	}, [students, searchQuery, statusFilter, hostelFilter]);

	function logout() {
		clearAuth();
		navigate('/admin/login', { replace: true });
	}

	const refreshAll = useCallback(async () => {
		setError('');
		setLoadingRefresh(true);

		try {
			const [studentsRes, attendanceRes, statsRes] = await Promise.all([
				api.get('/admin/students'),
				api.get('/admin/attendance'),
				api.get('/admin/stats').catch(() => null),
			]);

			const studentList = studentsRes.data?.students || [];
			setStudents(studentList);
			setAttendance(attendanceRes.data?.logs || []);

			if (statsRes?.data?.stats) {
				setStats(statsRes.data.stats);
			} else {
				// Fallback client computation
				const total = studentList.length;
				const inCount = studentList.filter((s) => s.status === 'IN').length;
				const outCount = total - inCount;
				const rate = total > 0 ? Math.round((inCount / total) * 100) : 0;
				setStats({
					totalStudents: total,
					totalIn: inCount,
					totalOut: outCount,
					totalTodayScans: attendanceRes.data?.logs?.length || 0,
					occupancyRate: rate,
				});
			}
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
					'Camera access failed. Please grant camera permissions in your browser.'
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

	async function handleManualSubmit(e) {
		e.preventDefault();
		setManualError('');
		setManualSuccess('');

		if (!manualRollNo.trim()) {
			setManualError('Please enter student roll number.');
			return;
		}

		setManualLoading(true);
		try {
			const res = await api.post('/admin/manual-scan', {
				rollNo: manualRollNo.trim(),
				action: manualAction,
			});

			setManualSuccess(res.data?.message || `Successfully marked ${manualAction} for roll ${manualRollNo}`);
			setManualRollNo('');
			await refreshAll();
		} catch (err) {
			setManualError(getErrorMessage(err));
		} finally {
			setManualLoading(false);
		}
	}

	async function handleExportCsv() {
		try {
			const response = await api.get('/admin/export', { responseType: 'blob' });
			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', `hostel_attendance_report_${new Date().toISOString().slice(0, 10)}.csv`);
			document.body.appendChild(link);
			link.click();
			link.remove();
		} catch (err) {
			alert('Failed to export CSV: ' + getErrorMessage(err));
		}
	}

	return (
		<div className="page py-4">
			{/* Top Bar Header */}
			<div className="card p-3 mb-4 border-0 shadow-sm bg-white">
				<div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
					<div className="d-flex align-items-center gap-2">
						<div className="stat-icon-wrapper stat-icon-cyan p-2 fs-4">
							<FaShieldAlt />
						</div>
						<div>
							<h3 className="m-0 h5 fw-bold text-dark">Guard &amp; Warden Security Console</h3>
							<div className="text-muted small">Hostel Entry-Exit Gate Supervision • VBSPU</div>
						</div>
					</div>

					<div className="d-flex flex-wrap gap-2">
						<button
							className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
							onClick={() => setShowManualModal(true)}
						>
							<FaUserPlus /> Manual Gate Override
						</button>

						<button
							className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
							onClick={handleExportCsv}
						>
							<FaFileCsv /> Export CSV Report
						</button>

						<button
							className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
							onClick={refreshAll}
							disabled={loadingRefresh}
						>
							<FaSyncAlt className={loadingRefresh ? 'spin' : ''} />
							{loadingRefresh ? 'Refreshing…' : 'Refresh Data'}
						</button>

						<button className="btn btn-danger btn-sm d-flex align-items-center gap-1" onClick={logout}>
							<FaSignOutAlt /> Logout
						</button>
					</div>
				</div>
			</div>

			{error ? <div className="alert alert-danger mb-4">{error}</div> : null}

			{/* Stat Highlights Bar */}
			<div className="row g-3 mb-4">
				<div className="col-6 col-md-3">
					<div className="stat-card">
						<div className="stat-icon-wrapper stat-icon-blue">
							<FaUserCheck />
						</div>
						<div>
							<div className="stat-val">{stats.totalStudents}</div>
							<div className="stat-label">Total Registered Students</div>
						</div>
					</div>
				</div>

				<div className="col-6 col-md-3">
					<div className="stat-card">
						<div className="stat-icon-wrapper stat-icon-emerald">
							<FaCheckCircle />
						</div>
						<div>
							<div className="stat-val text-success">{stats.totalIn}</div>
							<div className="stat-label">Currently IN (Inside Hostel)</div>
						</div>
					</div>
				</div>

				<div className="col-6 col-md-3">
					<div className="stat-card">
						<div className="stat-icon-wrapper stat-icon-rose">
							<FaTimesCircle />
						</div>
						<div>
							<div className="stat-val text-danger">{stats.totalOut}</div>
							<div className="stat-label">Currently OUT (Outside Hostel)</div>
						</div>
					</div>
				</div>

				<div className="col-6 col-md-3">
					<div className="stat-card">
						<div className="stat-icon-wrapper stat-icon-cyan">
							<FaQrcode />
						</div>
						<div>
							<div className="stat-val">{stats.occupancyRate}%</div>
							<div className="stat-label">Hostel Occupancy Rate</div>
							<div className="progress mt-1" style={{ height: 4 }}>
								<div className="progress-bar bg-info" style={{ width: `${stats.occupancyRate}%` }} />
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content Layout */}
			<div className="row g-4 mb-4">
				{/* Scanner Terminal (Left) */}
				<div className="col-lg-5">
					<div className="card h-100">
						<div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
							<span className="fw-bold d-flex align-items-center gap-2">
								<FaQrcode className="text-primary" /> Gate Scanner Console
							</span>
							<div className="btn-group btn-group-sm" role="group">
								<button
									type="button"
									className={`btn ${scanMode === 'qr' ? 'btn-primary' : 'btn-outline-primary'}`}
									onClick={() => setScanMode('qr')}
								>
									QR Scanner
								</button>
								<button
									type="button"
									className={`btn ${scanMode === 'face' ? 'btn-primary' : 'btn-outline-primary'}`}
									onClick={() => setScanMode('face')}
								>
									Face Verification
								</button>
							</div>
						</div>
						<div className="card-body p-3">
							{scanMode === 'qr' ? (
								<>
									<div className="face-scanner-frame mb-3">
										<video
											ref={videoRef}
											className="face-scanner-video"
											muted
											playsInline
										/>
									</div>

									{scanError ? (
										<div className="alert alert-warning py-2 small mb-2">{scanError}</div>
									) : null}

									{scanInfo?.status === 'processing' ? (
										<div className="alert alert-info py-2 small mb-2">Processing QR scan…</div>
									) : null}

									{scanInfo?.status === 'done' ? (
										<div className={`alert ${scanInfo.action === 'IN' ? 'alert-success' : 'alert-warning'} mb-0`}>
											<div className="d-flex align-items-center justify-content-between">
												<strong className="fs-6">Action: Mark {scanInfo.action}</strong>
												<span className="badge bg-dark">{scanInfo.action}</span>
											</div>
											{scanInfo.student ? (
												<div className="mt-1 fw-bold">
													{scanInfo.student.name} (Roll: {scanInfo.student.rollNo})
												</div>
											) : null}
											{scanInfo.attendance ? (
												<div className="mt-1 small opacity-75">
													IN: {formatDateTime(scanInfo.attendance.inTime)} | OUT:{' '}
													{formatDateTime(scanInfo.attendance.outTime)}
												</div>
											) : null}
											{scanInfo.message ? (
												<div className="mt-1 small font-monospace">{scanInfo.message}</div>
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

				{/* Live Student Directory & Filter Table (Right) */}
				<div className="col-lg-7">
					<div className="card mb-4">
						<div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
							<span className="fw-bold">Live Student Occupancy Directory</span>
							<span className="badge bg-primary">Showing {filteredStudents.length} Students</span>
						</div>
						<div className="card-body p-3">
							{/* Filter Bar */}
							<div className="row g-2 mb-3">
								<div className="col-12 col-md-5">
									<div className="input-group input-group-sm">
										<span className="input-group-text bg-white"><FaSearch className="text-muted" /></span>
										<input
											type="text"
											className="form-control"
											placeholder="Search Name / Roll No / Room..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
										/>
									</div>
								</div>

								<div className="col-6 col-md-3">
									<select
										className="form-select form-select-sm"
										value={statusFilter}
										onChange={(e) => setStatusFilter(e.target.value)}
									>
										<option value="ALL">All Statuses</option>
										<option value="IN">Currently IN</option>
										<option value="OUT">Currently OUT</option>
									</select>
								</div>

								<div className="col-6 col-md-4">
									<select
										className="form-select form-select-sm"
										value={hostelFilter}
										onChange={(e) => setHostelFilter(e.target.value)}
									>
										<option value="ALL">All Hostels</option>
										{hostelsList.map((h) => (
											<option key={h} value={h}>{h}</option>
										))}
									</select>
								</div>
							</div>

							{/* Directory Table */}
							{loadingStudents ? (
								<div className="p-3 text-muted">Loading live student directory…</div>
							) : filteredStudents.length ? (
								<div className="table-responsive" style={{ maxHeight: 380, overflowY: 'auto' }}>
									<table className="table table-hover align-middle mb-0">
										<thead className="table-light sticky-top">
											<tr>
												<th>Student Name</th>
												<th>Roll No</th>
												<th>Hostel / Room</th>
												<th>Status</th>
												<th>Action</th>
											</tr>
										</thead>
										<tbody>
											{filteredStudents.map((s) => (
												<tr key={s._id}>
													<td>
														<div className="fw-bold text-dark">{s.name}</div>
														<div className="text-muted small">{s.department}</div>
													</td>
													<td className="fw-semibold text-primary">{s.rollNo}</td>
													<td>
														<div>{s.hostelName}</div>
														<div className="text-muted small">Room {s.roomNo}</div>
													</td>
													<td>
														{s.status === 'IN' ? (
															<span className="status-pill status-pill-in">
																<span className="pulse-dot" /> IN
															</span>
														) : (
															<span className="status-pill status-pill-out">
																<span className="pulse-dot" /> OUT
															</span>
														)}
													</td>
													<td>
														<button
															className="btn btn-outline-dark btn-sm py-0 px-2"
															style={{ fontSize: '0.75rem' }}
															onClick={() => {
																setManualRollNo(s.rollNo);
																setManualAction(s.status === 'IN' ? 'OUT' : 'IN');
																setShowManualModal(true);
															}}
														>
															Toggle Gate
														</button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<div className="text-muted p-4 text-center">No matching students found.</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Full Logs Section */}
			<div className="card">
				<div className="card-header d-flex justify-content-between align-items-center">
					<span className="fw-bold">Master Attendance Log History</span>
					<button className="btn btn-outline-success btn-sm d-flex align-items-center gap-1" onClick={handleExportCsv}>
						<FaFileCsv /> Export Report CSV
					</button>
				</div>
				<div className="card-body p-3">
					{loadingAttendance ? (
						<div className="p-3 text-muted">Loading logs…</div>
					) : attendanceRows.length ? (
						<div className="table-responsive" style={{ maxHeight: 400, overflowY: 'auto' }}>
							<table className="table table-striped align-middle mb-0">
								<thead className="table-light sticky-top">
									<tr>
										<th>Date</th>
										<th>Student Name</th>
										<th>Roll No</th>
										<th>Hostel &amp; Room</th>
										<th>IN Timestamp</th>
										<th>OUT Timestamp</th>
									</tr>
								</thead>
								<tbody>
									{attendanceRows.map((row) => (
										<tr key={row.key}>
											<td className="fw-semibold">{row.date}</td>
											<td className="fw-bold text-dark">{row.name}</td>
											<td className="text-primary">{row.rollNo}</td>
											<td className="small">{row.hostelName} (Room {row.roomNo})</td>
											<td>{row.inTime ? <span className="text-success fw-semibold">{formatDateTime(row.inTime)}</span> : '-'}</td>
											<td>{row.outTime ? <span className="text-danger fw-semibold">{formatDateTime(row.outTime)}</span> : '-'}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<div className="text-muted p-3 text-center">No attendance logs found.</div>
					)}
				</div>
			</div>

			{/* Manual Gate Override Modal */}
			{showManualModal ? (
				<div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}>
					<div className="modal-dialog modal-dialog-centered">
						<div className="modal-content border-0 shadow-lg">
							<div className="modal-header bg-dark text-white">
								<h5 className="modal-title fw-bold">Manual Gate Entry/Exit Override</h5>
								<button
									type="button"
									className="btn-close btn-close-white"
									onClick={() => setShowManualModal(false)}
								></button>
							</div>
							<div className="modal-body p-4">
								{manualError ? <div className="alert alert-warning py-2 small">{manualError}</div> : null}
								{manualSuccess ? <div className="alert alert-success py-2 small">{manualSuccess}</div> : null}

								<form onSubmit={handleManualSubmit}>
									<div className="mb-3">
										<label className="form-label fw-bold small">Student Roll Number</label>
										<input
											type="text"
											className="form-control"
											placeholder="e.g. 21015001"
											value={manualRollNo}
											onChange={(e) => setManualRollNo(e.target.value)}
											required
											disabled={manualLoading}
										/>
									</div>

									<div className="mb-3">
										<label className="form-label fw-bold small">Action Gate Override</label>
										<div className="d-flex gap-3">
											<div className="form-check">
												<input
													className="form-check-input"
													type="radio"
													name="manualAction"
													id="actionIn"
													value="IN"
													checked={manualAction === 'IN'}
													onChange={() => setManualAction('IN')}
												/>
												<label className="form-check-label fw-semibold text-success" htmlFor="actionIn">
													Mark IN (Entering Hostel)
												</label>
											</div>
											<div className="form-check">
												<input
													className="form-check-input"
													type="radio"
													name="manualAction"
													id="actionOut"
													value="OUT"
													checked={manualAction === 'OUT'}
													onChange={() => setManualAction('OUT')}
												/>
												<label className="form-check-label fw-semibold text-danger" htmlFor="actionOut">
													Mark OUT (Exiting Hostel)
												</label>
											</div>
										</div>
									</div>

									<div className="d-flex gap-2 justify-content-end mt-4">
										<button
											type="button"
											className="btn btn-outline-secondary btn-sm"
											onClick={() => setShowManualModal(false)}
										>
											Close
										</button>
										<button
											type="submit"
											className="btn btn-primary btn-sm"
											disabled={manualLoading}
										>
											{manualLoading ? 'Recording…' : 'Submit Gate Action'}
										</button>
									</div>
								</form>
							</div>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
