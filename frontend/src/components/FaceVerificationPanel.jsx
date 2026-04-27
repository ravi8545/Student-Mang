import React, { useState } from 'react';

import { api } from '../api/axios';
import FaceScanner from './FaceScannerClean.jsx';

function getErrorMessage(err) {
	const data = err?.response?.data;
	if (Array.isArray(data?.errors) && data.errors.length) {
		return data.errors
			.map((item) => item?.message)
			.filter(Boolean)
			.join(', ');
	}

	return (
		data?.message ||
		data?.error ||
		err?.message ||
		'Something went wrong'
	);
}

function formatConfidence(distance, threshold) {
	if (typeof distance !== 'number' || typeof threshold !== 'number' || threshold <= 0) {
		return '-';
	}
	const score = Math.max(0, Math.min(100, Math.round((1 - distance / threshold) * 100)));
	return `${score}%`;
}

export default function FaceVerificationPanel({ onAttendanceMarked }) {
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [verifying, setVerifying] = useState(false);
	const [matchInfo, setMatchInfo] = useState(null);

	async function handleCapture(payload) {
		setError('');
		setSuccess('');
		setMatchInfo(null);
		setVerifying(true);

		try {
			const verifyRes = await api.post('/face/verify', {
				faceLandmarks: payload.faceLandmarks,
			});

			const studentId = verifyRes.data?.studentId;
			if (!studentId) {
				throw new Error('Face matched but no studentId was returned');
			}

			const attendanceRes = await api.post('/attendance/scan', { studentId });
			const data = attendanceRes.data || {};
			setMatchInfo({
				student: data.student || verifyRes.data?.student || null,
				action: data.action || null,
				distance: verifyRes.data?.distance,
				threshold: verifyRes.data?.threshold,
			});
			setSuccess(data.message || 'Face matched and attendance marked');
			await onAttendanceMarked?.(attendanceRes.data);
		} catch (err) {
			setError(getErrorMessage(err));
		} finally {
			setVerifying(false);
		}
	}

	return (
		<div className="card face-card h-100">
			<div className="card-header d-flex justify-content-between align-items-center">
				<span>Face Scanner</span>
				<span className="badge text-bg-primary">Admin only</span>
			</div>
			<div className="card-body">
				<p className="text-muted mb-3">
					Use the webcam to capture a face sample, match it against registered student
					landmarks, then mark attendance through the existing attendance API.
				</p>

				{error ? <div className="alert alert-danger">{error}</div> : null}
				{success ? <div className="alert alert-success">{success}</div> : null}

				<FaceScanner
					title="Admin face verification"
					description="Keep the student centered and well lit, then verify the face."
					captureLabel={verifying ? 'Verifying…' : 'Verify face and mark attendance'}
					cameraFacingMode="environment"
					disabled={verifying}
					onCapture={handleCapture}
				/>

				{matchInfo ? (
					<div className="alert alert-success mt-3 mb-0">
						<div>
							<strong>Student:</strong> {matchInfo.student?.name || '-'} ({matchInfo.student?.rollNo || '-'})
						</div>
						<div>
							<strong>Action:</strong> {matchInfo.action || '-'}
						</div>
						<div className="small text-muted">
							Confidence: {formatConfidence(matchInfo.distance, matchInfo.threshold)}
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}
