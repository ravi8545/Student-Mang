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

export default function FaceRegistrationCard({ student, onRegistered }) {
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [saving, setSaving] = useState(false);

	async function handleCapture(payload) {
		setError('');
		setSuccess('');
		setSaving(true);

		try {
			const res = await api.post('/face/register', {
				faceLandmarks: payload.faceLandmarks,
				faceImageDataUrl: payload.faceImageDataUrl,
			});

			setSuccess(res.data?.message || 'Face registered successfully');
			onRegistered?.(res.data?.student || null);
		} catch (err) {
			setError(getErrorMessage(err));
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="card face-card h-100">
			<div className="card-header d-flex justify-content-between align-items-center">
				<span>Face Registration</span>
				<span className={`badge text-bg-${student?.faceRegisteredAt ? 'success' : 'secondary'}`}>
					{student?.faceRegisteredAt ? 'Registered' : 'Not registered'}
				</span>
			</div>
			<div className="card-body">
				<p className="text-muted mb-3">
					Register your face once with the webcam. The app stores a normalized MediaPipe
					landmark descriptor, not your QR flow.
				</p>

				{error ? <div className="alert alert-danger">{error}</div> : null}
				{success ? <div className="alert alert-success">{success}</div> : null}

				<FaceScanner
					title="Student face capture"
					description="Center your face, keep good lighting, then capture the sample."
					captureLabel={saving ? 'Saving…' : 'Capture and register face'}
					cameraFacingMode="user"
					disabled={saving}
					onCapture={handleCapture}
				/>
			</div>
		</div>
	);
}
