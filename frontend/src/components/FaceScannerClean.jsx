import React, { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const WASM_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const MODEL_PATH =
	'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

function getErrorMessage(err) {
	return (
		err?.message ||
		err?.response?.data?.message ||
		err?.response?.data?.error ||
		'Camera or face model failed to start'
	);
}

function normalizeLandmarks(landmarks) {
	if (!Array.isArray(landmarks) || !landmarks.length) return [];

	return landmarks
		.map((point) => ({
			x: Number(point?.x),
			y: Number(point?.y),
			z: Number(point?.z ?? 0),
		}))
		.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z));
}

function drawOverlay(ctx, landmarks, width, height) {
	ctx.clearRect(0, 0, width, height);
	if (!Array.isArray(landmarks) || !landmarks.length) return;

	// Draw facial mesh overlay with glowing dots
	ctx.fillStyle = '#3b82f6';
	for (const point of landmarks) {
		const x = point.x * width;
		const y = point.y * height;
		ctx.beginPath();
		ctx.arc(x, y, 1.8, 0, Math.PI * 2);
		ctx.fill();
	}
}

function captureFrame(videoEl) {
	if (!videoEl?.videoWidth || !videoEl?.videoHeight) return '';
	const maxSide = 640;
	const jpegQuality = 0.8;

	const sourceWidth = videoEl.videoWidth;
	const sourceHeight = videoEl.videoHeight;
	const longestSide = Math.max(sourceWidth, sourceHeight);
	const scale = longestSide > maxSide ? maxSide / longestSide : 1;

	const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
	const targetHeight = Math.max(1, Math.round(sourceHeight * scale));

	const canvas = document.createElement('canvas');
	canvas.width = targetWidth;
	canvas.height = targetHeight;
	const ctx = canvas.getContext('2d');
	if (!ctx) return '';
	ctx.drawImage(videoEl, 0, 0, targetWidth, targetHeight);

	return canvas.toDataURL('image/jpeg', jpegQuality);
}

export default function FaceScanner({
	title,
	description,
	captureLabel,
	cameraFacingMode = 'user',
	onCapture,
	disabled = false,
}) {
	const videoRef = useRef(null);
	const canvasRef = useRef(null);
	const streamRef = useRef(null);
	const landmarkerRef = useRef(null);
	const rafRef = useRef(0);
	const latestLandmarksRef = useRef([]);
	const statusRef = useRef('loading');
	const messageRef = useRef('Loading face scanner…');

	const [status, setStatus] = useState('loading');
	const [message, setMessage] = useState('Loading face scanner…');
	const [previewUrl, setPreviewUrl] = useState('');
	const [capturing, setCapturing] = useState(false);

	function updateStatus(nextStatus) {
		statusRef.current = nextStatus;
		setStatus(nextStatus);
	}

	function updateMessage(nextMessage) {
		messageRef.current = nextMessage;
		setMessage(nextMessage);
	}

	useEffect(() => {
		let active = true;

		async function start() {
			try {
				updateStatus('loading');
				updateMessage('Initializing face detection neural network…');

				const filesetResolver = await FilesetResolver.forVisionTasks(WASM_PATH);
				if (!active) return;

				landmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
					baseOptions: { modelAssetPath: MODEL_PATH },
					runningMode: 'VIDEO',
					numFaces: 1,
				});
				if (!active) return;

				const stream = await navigator.mediaDevices.getUserMedia({
					video: {
						facingMode: cameraFacingMode,
						width: { ideal: 1280 },
						height: { ideal: 720 },
					},
					audio: false,
				});

				if (!active) {
					stream.getTracks().forEach((track) => track.stop());
					return;
				}

				streamRef.current = stream;
				const videoEl = videoRef.current;
				if (!videoEl) return;

				videoEl.srcObject = stream;
				await videoEl.play();

				const renderLoop = () => {
					if (!active) return;
					const video = videoRef.current;
					const canvas = canvasRef.current;
					const landmarker = landmarkerRef.current;

					if (video && canvas && landmarker && video.readyState >= 2) {
						const detection = landmarker.detectForVideo(video, performance.now());
						const landmarks = normalizeLandmarks(detection?.faceLandmarks?.[0] || []);
						latestLandmarksRef.current = landmarks;

						const ctx = canvas.getContext('2d');
						if (ctx) {
							if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
								canvas.width = video.videoWidth;
								canvas.height = video.videoHeight;
							}
							drawOverlay(ctx, landmarks, canvas.width, canvas.height);
						}

						if (landmarks.length) {
							if (statusRef.current !== 'ready') updateStatus('ready');
							if (messageRef.current) updateMessage('');
						} else {
							if (statusRef.current !== 'searching') updateStatus('searching');
							if (messageRef.current !== 'Align your face in the camera frame and stay clear.') {
								updateMessage('Align your face in the camera frame and stay clear.');
							}
						}
					}

					rafRef.current = window.requestAnimationFrame(renderLoop);
				};

				renderLoop();
			} catch (err) {
				if (!active) return;
				updateStatus('error');
				updateMessage(getErrorMessage(err));
			}
		}

		start();

		return () => {
			active = false;
			if (rafRef.current) {
				window.cancelAnimationFrame(rafRef.current);
			}
			latestLandmarksRef.current = [];
			try {
				landmarkerRef.current?.close?.();
			} catch {
				// ignore cleanup failures
			}
			landmarkerRef.current = null;
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
				streamRef.current = null;
			}
		};
	}, [cameraFacingMode]);

	async function handleCapture() {
		if (disabled || capturing) return;
		setCapturing(true);
		updateMessage('Capturing high-resolution face sample…');

		try {
			const videoEl = videoRef.current;
			const faceLandmarks = latestLandmarksRef.current;
			if (!faceLandmarks.length) {
				throw new Error('No clear face detected in frame');
			}

			const faceImageDataUrl = captureFrame(videoEl);
			setPreviewUrl(faceImageDataUrl);

			await onCapture?.({ faceLandmarks, faceImageDataUrl });
			updateMessage('Face sample captured and processed successfully.');
		} catch (err) {
			updateMessage(getErrorMessage(err));
		} finally {
			setCapturing(false);
		}
	}

	const isUserMode = cameraFacingMode === 'user';

	return (
		<div className="face-scanner-shell p-3 rounded bg-light border">
			<div className="d-flex justify-content-between align-items-start gap-3 mb-2">
				<div>
					<div className="fw-bold text-dark">{title}</div>
					<div className="small text-muted">{description}</div>
				</div>
				<span
					className={`badge text-bg-${
						status === 'error' ? 'danger' : status === 'ready' ? 'success' : 'secondary'
					}`}
				>
					{status}
				</span>
			</div>

			<div
				className="face-scanner-frame border shadow-sm rounded overflow-hidden position-relative bg-dark"
				style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
			>
				<video
					ref={videoRef}
					className="face-scanner-video w-100 h-100"
					style={{
						objectFit: 'contain',
						transform: isUserMode ? 'scaleX(-1)' : 'none',
					}}
					muted
					playsInline
				/>
				<canvas
					ref={canvasRef}
					className="face-scanner-overlay position-absolute inset-0 w-100 h-100 pointer-events-none"
					style={{
						objectFit: 'contain',
						transform: isUserMode ? 'scaleX(-1)' : 'none',
					}}
				/>
			</div>

			<div className="d-flex flex-wrap gap-2 align-items-center mt-3">
				<button
					className="btn btn-primary fw-bold"
					onClick={handleCapture}
					disabled={disabled || capturing || status === 'loading'}
					type="button"
				>
					{capturing ? 'Processing…' : captureLabel}
				</button>
				<div className="small text-muted">
					{status === 'ready' ? '✓ Face aligned & ready' : 'Waiting for face alignment'}
				</div>
			</div>

			{message ? <div className="alert alert-info py-2 small mt-3 mb-0">{message}</div> : null}

			{previewUrl ? (
				<div className="mt-3 text-center">
					<div className="small text-muted mb-1">Captured Sample Preview:</div>
					<img className="face-preview-image border rounded shadow-sm" src={previewUrl} alt="Captured face preview" style={{ maxWidth: 240, maxHeight: 180, objectFit: 'cover' }} />
				</div>
			) : null}
		</div>
	);
}
