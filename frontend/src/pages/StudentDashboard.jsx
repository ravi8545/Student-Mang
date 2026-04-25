import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { api } from '../api/axios';
import { clearAuth } from '../api/authStorage';

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

	const [loadingProfile, setLoadingProfile] = useState(true);
	const [loadingQr, setLoadingQr] = useState(true);
	const [loadingLogs, setLoadingLogs] = useState(true);
	const [error, setError] = useState('');

	const recentRows = useMemo(() => getSessionRowsFromLogs(logs).slice(0, 20), [logs]);

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
			setPhotoSuccess(res.data?.message || 'Profile photo updated.');
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

				// Prefer stored QR from MongoDB (generated at signup).
				if (s?.qrCodeDataUrl) {
					setQrDataUrl(s.qrCodeDataUrl);
					setLoadingQr(false);
				} else {
					// Fallback: fetch stored QR via API endpoint.
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
				// loadingQr is handled above.
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
				<h3 className="m-0">Student Dashboard</h3>
				<div className="d-flex gap-2">
					<Link to="/student/attendance" className="btn btn-outline-primary btn-sm">
						Attendance History
					</Link>
					<button className="btn btn-outline-danger btn-sm" onClick={logout}>
						Logout
					</button>
				</div>
			</div>

			{error ? <div className="alert alert-danger">{error}</div> : null}

			<div className="row g-3">
				<div className="col-md-6">
					<div className="card h-100">
						<div className="card-header">Profile</div>
						<div className="card-body">
							{loadingProfile ? (
								<div>Loading profile…</div>
							) : student ? (
								<div>
									<div className="text-center mb-3">
										<img
											src={student.photoUrl || placeholderUrl}
											alt="Profile"
											className="profile-photo"
										/>
									</div>

									{photoError ? (
										<div className="alert alert-warning">{photoError}</div>
									) : null}
									{photoSuccess ? (
										<div className="alert alert-success">{photoSuccess}</div>
									) : null}

									<div className="row g-2 align-items-end mb-3">
										<div className="col-12 col-md-8">
											<label className="form-label mb-1">Upload / Update Profile Photo</label>
											<input
												key={photoInputKey}
												type="file"
												className="form-control"
												accept="image/*"
												onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
												disabled={photoUploading}
											/>
										</div>
										<div className="col-12 col-md-4">
											<button
												className="btn btn-outline-primary w-100"
												onClick={uploadProfilePhoto}
												disabled={photoUploading}
												type="button"
											>
												{photoUploading ? 'Uploading…' : 'Upload'}
											</button>
										</div>
									</div>

									<div className="table-responsive">
										<table className="table table-sm mb-0">
											<tbody>
												<tr>
													<th>Name</th>
													<td>{student.name}</td>
												</tr>
												<tr>
													<th>Roll No</th>
													<td>{student.rollNo}</td>
												</tr>
												<tr>
													<th>Email</th>
													<td>{student.email}</td>
												</tr>
												<tr>
													<th>Department</th>
													<td>{student.department}</td>
												</tr>
												<tr>
													<th>Room No</th>
													<td>{student.roomNo}</td>
												</tr>
												<tr>
													<th>Hostel</th>
													<td>{student.hostelName}</td>
												</tr>
											</tbody>
										</table>
									</div>
								</div>
							) : (
								<div className="text-muted">No profile loaded</div>
							)}
						</div>
					</div>
				</div>

				<div className="col-md-6">
					<div className="card h-100">
						<div className="card-header">My QR Code</div>
						<div className="card-body">
							{loadingQr ? (
								<div>Loading QR…</div>
							) : qrDataUrl ? (
								<div className="text-center">
									<img
										src={qrDataUrl}
										alt="Student QR"
										style={{ maxWidth: 300, width: '100%' }}
									/>
									<div className="mt-3">
										<button
											className="btn btn-outline-primary btn-sm"
											onClick={downloadQrCode}
										>
											Download QR Code
										</button>
									</div>
									<div className="small text-muted mt-2">
										Show this QR at the hostel gate to mark IN/OUT.
									</div>
								</div>
							) : (
								<div className="alert alert-warning mb-0">
									QR code not available.
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			<div className="card mt-3">
				<div className="card-header d-flex justify-content-between align-items-center">
					<span>Recent Attendance (Last 20)</span>
					<Link to="/student/attendance" className="btn btn-outline-primary btn-sm">
						View full history
					</Link>
				</div>
				<div className="card-body">
					{loadingLogs ? (
						<div>Loading attendance…</div>
							) : recentRows.length ? (
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
											{recentRows.map((row) => (
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
