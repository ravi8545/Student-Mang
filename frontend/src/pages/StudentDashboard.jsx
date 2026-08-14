import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaQrcode, FaDownload, FaIdCard, FaPrint, FaSignOutAlt, FaUserCheck, FaCamera, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

import { api } from '../api/axios';
import { clearAuth } from '../api/authStorage';
import FaceRegistrationCard from '../components/FaceRegistrationCard.jsx';

import placeholderUrl from '../assets/profile-placeholder.svg';

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

export default function StudentDashboard() {
	const navigate = useNavigate();
	const [student, setStudent] = useState(null);
	const [qrDataUrl, setQrDataUrl] = useState('');
	const [logs, setLogs] = useState([]);
	const [photoFile, setPhotoFile] = useState(null);
	const [photoInputKey, setPhotoInputKey] = useState(0);
	const [photoUploading, setPhotoUploading] = useState(false);
	const [photoError, setPhotoError] = useState('');
	const [photoSuccess, setPhotoSuccess] = useState('');

	const [showIdModal, setShowIdModal] = useState(false);

	const [loadingProfile, setLoadingProfile] = useState(true);
	const [loadingQr, setLoadingQr] = useState(true);
	const [loadingLogs, setLoadingLogs] = useState(true);
	const [error, setError] = useState('');

	const allRows = useMemo(() => getSessionRowsFromLogs(logs), [logs]);
	const recentRows = useMemo(() => allRows.slice(0, 15), [allRows]);

	// Calculate student's current status (IN if latest session has inTime but no outTime)
	const isCurrentlyIn = useMemo(() => {
		if (!allRows.length) return false;
		const latest = allRows[0];
		return Boolean(latest.inTime && !latest.outTime);
	}, [allRows]);

	function logout() {
		clearAuth();
		navigate('/login', { replace: true });
	}

	function downloadQrCode() {
		if (!qrDataUrl) return;
		const link = document.createElement('a');
		link.href = qrDataUrl;
		link.download = `HostelQR_${student?.rollNo || 'QR'}.png`;
		document.body.appendChild(link);
		link.click();
		link.remove();
	}

	function handlePrintIdCard() {
		window.print();
	}

	async function uploadProfilePhoto() {
		setPhotoError('');
		setPhotoSuccess('');
		if (!photoFile) {
			setPhotoError('Please select an image file to upload.');
			return;
		}

		setPhotoUploading(true);
		try {
			const data = new FormData();
			data.append('photo', photoFile);
			const res = await api.post('/auth/me/photo', data);
			const updatedStudent = res.data?.student;
			if (updatedStudent) setStudent(updatedStudent);
			else {
				setStudent((prev) =>
					prev
						? { ...prev, photoUrl: res.data?.photoUrl || prev.photoUrl }
						: prev
				);
			}
			setPhotoSuccess(res.data?.message || 'Profile photo updated successfully.');
			setPhotoFile(null);
			setPhotoInputKey((k) => k + 1);
		} catch (err) {
			setPhotoError(getErrorMessage(err));
		} finally {
			setPhotoUploading(false);
		}
	}

	useEffect(() => {
		let alive = true;

		async function load() {
			setError('');

			try {
				setLoadingProfile(true);
				setLoadingQr(true);
				setLoadingLogs(true);

				const [meRes, logsRes] = await Promise.all([
					api.get('/auth/me'),
					api.get('/attendance/me'),
				]);

				if (!alive) return;
				const s = meRes.data?.student;
				setStudent(s);
				setLogs(logsRes.data?.logs || []);

				if (s?.qrCodeDataUrl) {
					setQrDataUrl(s.qrCodeDataUrl);
					setLoadingQr(false);
				} else {
					try {
						const qrRes = await api.get('/auth/me/qr');
						if (!alive) return;
						setQrDataUrl(qrRes.data?.qrDataUrl || '');
					} finally {
						if (alive) setLoadingQr(false);
					}
				}
			} catch (err) {
				if (!alive) return;
				setError(getErrorMessage(err));
			} finally {
				if (!alive) return;
				setLoadingProfile(false);
				setLoadingLogs(false);
			}
		}

		load();
		return () => {
			alive = false;
		};
	}, []);

	return (
		<div className="page py-4">
			{/* Top Bar Header */}
			<div className="card p-3 mb-4 border-0 shadow-sm bg-white">
				<div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
					<div className="d-flex align-items-center gap-3">
						<img
							src={student?.photoUrl || placeholderUrl}
							alt="Profile"
							className="profile-photo"
							style={{ width: 56, height: 56 }}
						/>
						<div>
							<div className="d-flex align-items-center gap-2">
								<h3 className="m-0 h5 fw-bold text-dark">{student ? student.name : 'Student Dashboard'}</h3>
								{isCurrentlyIn ? (
									<span className="status-pill status-pill-in">
										<span className="pulse-dot" /> INSIDE HOSTEL
									</span>
								) : (
									<span className="status-pill status-pill-out">
										<span className="pulse-dot" /> OUTSIDE HOSTEL
									</span>
								)}
							</div>
							<div className="text-muted small">
								Roll No: <strong>{student?.rollNo || '-'}</strong> | {student?.hostelName || 'Hostel Resident'} (Room {student?.roomNo || '-'})
							</div>
						</div>
					</div>

					<div className="d-flex flex-wrap gap-2">
						<button className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1" onClick={() => setShowIdModal(true)}>
							<FaIdCard /> Digital Gate Pass
						</button>
						<Link to="/student/attendance" className="btn btn-outline-secondary btn-sm">
							Full Logs
						</Link>
						<button className="btn btn-danger btn-sm d-flex align-items-center gap-1" onClick={logout}>
							<FaSignOutAlt /> Logout
						</button>
					</div>
				</div>
			</div>

			{error ? <div className="alert alert-danger mb-4">{error}</div> : null}

			{/* Main Grid */}
			<div className="row g-4 mb-4">
				{/* Profile Details Card */}
				<div className="col-lg-6">
					<div className="card h-100">
						<div className="card-header d-flex justify-content-between align-items-center">
							<span>Student Identity Profile</span>
							<span className="badge bg-primary-subtle text-primary">VBSPU Resident</span>
						</div>
						<div className="card-body">
							{loadingProfile ? (
								<div className="p-4 text-center text-muted">Loading profile data…</div>
							) : student ? (
								<div>
									<div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded">
										<img
											src={student.photoUrl || placeholderUrl}
											alt="Profile"
											className="profile-photo"
										/>
										<div className="flex-grow-1">
											<div className="fw-bold fs-5 text-dark">{student.name}</div>
											<div className="text-muted small mb-2">{student.email}</div>
											<div className="d-flex flex-wrap gap-1">
												<span className="badge bg-secondary-subtle text-dark small">{student.department}</span>
												<span className="badge bg-info-subtle text-info small">Room {student.roomNo}</span>
											</div>
										</div>
									</div>

									{photoError ? <div className="alert alert-warning py-2 small">{photoError}</div> : null}
									{photoSuccess ? <div className="alert alert-success py-2 small">{photoSuccess}</div> : null}

									<div className="row g-2 align-items-center mb-4 p-3 border rounded bg-white">
										<div className="col-12 col-md-8">
											<label className="form-label small fw-bold mb-1 d-flex align-items-center gap-1">
												<FaCamera /> Upload / Update Profile Photo
											</label>
											<input
												key={photoInputKey}
												type="file"
												className="form-control form-control-sm"
												accept="image/*"
												onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
												disabled={photoUploading}
											/>
										</div>
										<div className="col-12 col-md-4">
											<button
												className="btn btn-primary btn-sm w-100 mt-md-4"
												onClick={uploadProfilePhoto}
												disabled={photoUploading || !photoFile}
												type="button"
											>
												{photoUploading ? 'Uploading…' : 'Update Photo'}
											</button>
										</div>
									</div>

									<div className="table-responsive">
										<table className="table table-sm align-middle mb-0">
											<tbody>
												<tr>
													<th style={{ width: '35%' }}>Full Name</th>
													<td className="fw-semibold">{student.name}</td>
												</tr>
												<tr>
													<th>Roll Number</th>
													<td className="fw-semibold text-primary">{student.rollNo}</td>
												</tr>
												<tr>
													<th>Department</th>
													<td>{student.department}</td>
												</tr>
												<tr>
													<th>Hostel Name</th>
													<td>{student.hostelName}</td>
												</tr>
												<tr>
													<th>Room Number</th>
													<td>{student.roomNo}</td>
												</tr>
												<tr>
													<th>Face Biometric</th>
													<td>
														{student.faceRegisteredAt ? (
															<span className="text-success d-flex align-items-center gap-1 small fw-bold">
																<FaCheckCircle /> Registered on {formatDateTime(student.faceRegisteredAt)}
															</span>
														) : (
															<span className="text-warning d-flex align-items-center gap-1 small fw-bold">
																<FaExclamationCircle /> Not registered yet
															</span>
														)}
													</td>
												</tr>
											</tbody>
										</table>
									</div>
								</div>
							) : (
								<div className="text-muted p-3">No student profile loaded.</div>
							)}
						</div>
					</div>
				</div>

				{/* My QR Code Pass Card */}
				<div className="col-lg-6">
					<div className="card h-100">
						<div className="card-header d-flex justify-content-between align-items-center">
							<span className="d-flex align-items-center gap-2">
								<FaQrcode className="text-primary" /> Personal Gate Pass QR
							</span>
							<span className="badge bg-success-subtle text-success">Active Pass</span>
						</div>
						<div className="card-body d-flex flex-column align-items-center justify-content-center p-4">
							{loadingQr ? (
								<div className="p-4 text-muted">Generating QR Pass…</div>
							) : qrDataUrl ? (
								<div className="text-center w-100">
									<div className="p-3 bg-white rounded shadow-sm d-inline-block border mb-3">
										<img
											src={qrDataUrl}
											alt="Student QR Pass"
											style={{ maxWidth: 220, width: '100%', display: 'block' }}
										/>
									</div>
									<div className="fw-bold text-dark mb-1">{student?.name}</div>
									<div className="text-muted small mb-3">Roll No: {student?.rollNo}</div>

									<div className="d-flex justify-content-center gap-2">
										<button
											className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
											onClick={downloadQrCode}
										>
											<FaDownload /> Download PNG
										</button>
										<button
											className="btn btn-primary btn-sm d-flex align-items-center gap-1"
											onClick={() => setShowIdModal(true)}
										>
											<FaIdCard /> View Gate Pass
										</button>
									</div>
									<div className="form-text small mt-3">
										Show this QR code at the hostel gate for guard scan.
									</div>
								</div>
							) : (
								<div className="alert alert-warning mb-0">
									QR code pass is unavailable. Please reload.
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Face Registration Section */}
			<div className="mb-4">
				<FaceRegistrationCard
					student={student}
					onRegistered={(updatedFaceStudent) => {
						if (!updatedFaceStudent) return;
						setStudent((prev) =>
							prev
								? { ...prev, faceRegisteredAt: updatedFaceStudent.faceRegisteredAt }
								: prev
						);
					}}
				/>
			</div>

			{/* Recent Attendance Log */}
			<div className="card">
				<div className="card-header d-flex justify-content-between align-items-center">
					<span className="fw-bold">Recent Entry/Exit Activity</span>
					<Link to="/student/attendance" className="btn btn-outline-primary btn-sm">
						View Complete History
					</Link>
				</div>
				<div className="card-body">
					{loadingLogs ? (
						<div className="p-3 text-muted">Loading attendance history…</div>
					) : recentRows.length ? (
						<div className="table-responsive">
							<table className="table table-hover align-middle mb-0">
								<thead>
									<tr>
										<th>Date</th>
										<th>IN Time (Entry)</th>
										<th>OUT Time (Exit)</th>
										<th>Status Session</th>
									</tr>
								</thead>
								<tbody>
									{recentRows.map((row) => (
										<tr key={row.key}>
											<td className="fw-semibold text-dark">{row.date}</td>
											<td>
												{row.inTime ? (
													<span className="text-success fw-bold">
														{formatDateTime(row.inTime)}
													</span>
												) : (
													'-'
												)}
											</td>
											<td>
												{row.outTime ? (
													<span className="text-danger fw-bold">
														{formatDateTime(row.outTime)}
													</span>
												) : (
													<span className="badge bg-success-subtle text-success">Currently IN</span>
												)}
											</td>
											<td>
												{row.inTime && !row.outTime ? (
													<span className="badge text-bg-success">Active Session</span>
												) : (
													<span className="badge text-bg-secondary">Completed Session</span>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<div className="text-muted p-3 text-center">No attendance activity recorded yet.</div>
					)}
				</div>
			</div>

			{/* Digital ID Card Modal */}
			{showIdModal && student ? (
				<div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)' }}>
					<div className="modal-dialog modal-dialog-centered">
						<div className="modal-content id-card-modal-content border-0">
							<div className="id-card-header position-relative">
								<button
									type="button"
									className="btn-close btn-close-white position-absolute top-0 end-0 m-3"
									onClick={() => setShowIdModal(false)}
								></button>
								<div className="fw-bold text-uppercase tracking-wider small opacity-75">VBS Purvanchal University</div>
								<h4 className="m-0 fw-bold">Hostel Resident Gate Pass</h4>
							</div>
							<div className="modal-body p-4 text-center">
								<img
									src={student.photoUrl || placeholderUrl}
									alt="Student"
									className="id-photo-frame mb-3"
								/>
								<h3 className="h4 fw-bold mb-1 text-white">{student.name}</h3>
								<div className="text-info fw-semibold mb-3">Roll No: {student.rollNo}</div>

								<div className="row g-2 text-start bg-dark p-3 rounded mb-3 border border-secondary">
									<div className="col-6">
										<span className="text-muted small">Department:</span>
										<div className="fw-semibold text-light">{student.department}</div>
									</div>
									<div className="col-6">
										<span className="text-muted small">Hostel:</span>
										<div className="fw-semibold text-light">{student.hostelName}</div>
									</div>
									<div className="col-6 mt-2">
										<span className="text-muted small">Room No:</span>
										<div className="fw-semibold text-light">{student.roomNo}</div>
									</div>
									<div className="col-6 mt-2">
										<span className="text-muted small">Pass Status:</span>
										<div>
											{isCurrentlyIn ? (
												<span className="badge bg-success">INSIDE HOSTEL</span>
											) : (
												<span className="badge bg-danger">OUTSIDE HOSTEL</span>
											)}
										</div>
									</div>
								</div>

								{qrDataUrl && (
									<div className="bg-white p-2 d-inline-block rounded mb-3">
										<img src={qrDataUrl} alt="QR" style={{ width: 140, height: 140 }} />
									</div>
								)}

								<div className="d-flex gap-2 justify-content-center">
									<button className="btn btn-light btn-sm d-flex align-items-center gap-1" onClick={handlePrintIdCard}>
										<FaPrint /> Print Pass
									</button>
									<button className="btn btn-outline-light btn-sm" onClick={() => setShowIdModal(false)}>
										Close
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
