const DEFAULT_FACE_MATCH_THRESHOLD = Number(process.env.FACE_MATCH_THRESHOLD || 0.28);

export function sanitizeFaceLandmarks(landmarks) {
	if (!Array.isArray(landmarks)) return [];

	return landmarks
		.map((point) => ({
			x: Number(point?.x),
			y: Number(point?.y),
			z: Number(point?.z ?? 0),
			w: Number(point?.w ?? 0),
			h: Number(point?.h ?? 0),
		}))
		.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z));
}

/**
 * Builds an eye-centered, 2D-roll compensated, aspect-ratio normalized face descriptor.
 * Uses MediaPipe 478/468 landmark geometry.
 */
export function buildFaceDescriptor(landmarks, explicitAspectRatio = null) {
	const points = sanitizeFaceLandmarks(landmarks);
	if (!points.length || points.length < 10) return [];

	// Determine camera aspect ratio (Width / Height)
	let aspect = explicitAspectRatio;
	if (!aspect || aspect <= 0) {
		// Check if point has w and h attached
		const firstPointWithDim = points.find((p) => p.w > 0 && p.h > 0);
		if (firstPointWithDim) {
			aspect = firstPointWithDim.w / firstPointWithDim.h;
		}
	}

	// Anatomical fallback aspect ratio estimator if missing
	if (!aspect || aspect <= 0) {
		const pLeft33 = points[33] || points[0];
		const pRight263 = points[263] || points[points.length - 1];
		const nose = points[1] || points[0];
		const chin = points[152] || points[points.length - 1];

		const dxUnscaled = Math.abs(pRight263.x - pLeft33.x);
		const dyUnscaled = Math.abs(chin.y - (pLeft33.y + pRight263.y) / 2);

		if (dxUnscaled > 1e-4 && dyUnscaled > 1e-4) {
			// In human faces, InterOcularDistance / EyeToChinDistance is approx 0.44
			aspect = (0.44 * dyUnscaled) / dxUnscaled;
			aspect = Math.max(0.5, Math.min(2.5, aspect));
		} else {
			aspect = 1.7778; // Default 16:9 landscape aspect ratio
		}
	}

	// 1. Transform all points into 2D isotropic space (x_iso = x * aspect, y_iso = y, z_iso = z * aspect)
	const isoPoints = points.map((p) => ({
		x: p.x * aspect,
		y: p.y,
		z: p.z * aspect,
	}));

	// Nose tip landmark index 1
	const nose = isoPoints[1] || isoPoints[0];

	// Left Eye (33, 133) & Right Eye (362, 263)
	const pLeft33 = isoPoints[33] || isoPoints[0];
	const pLeft133 = isoPoints[133] || isoPoints[0];
	const pRight362 = isoPoints[362] || isoPoints[isoPoints.length - 1];
	const pRight263 = isoPoints[263] || isoPoints[isoPoints.length - 1];

	const leftEye = {
		x: (pLeft33.x + pLeft133.x) / 2,
		y: (pLeft33.y + pLeft133.y) / 2,
		z: (pLeft33.z + pLeft133.z) / 2,
	};

	const rightEye = {
		x: (pRight362.x + pRight263.x) / 2,
		y: (pRight362.y + pRight263.y) / 2,
		z: (pRight362.z + pRight263.z) / 2,
	};

	const dx = rightEye.x - leftEye.x;
	const dy = rightEye.y - leftEye.y;
	const dz = rightEye.z - leftEye.z;

	const interOcularDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
	const scale = interOcularDist > 1e-4 ? interOcularDist : 0.1;

	// Roll angle theta for 2D rotation compensation
	const rollAngle = Math.atan2(dy, dx);
	const cosTheta = Math.cos(-rollAngle);
	const sinTheta = Math.sin(-rollAngle);

	const descriptor = [];
	for (const point of isoPoints) {
		// Translate relative to nose tip
		const tx = point.x - nose.x;
		const ty = point.y - nose.y;
		const tz = point.z - nose.z;

		// Rotate to align horizontal eye axis
		const rx = tx * cosTheta - ty * sinTheta;
		const ry = tx * sinTheta + ty * cosTheta;
		const rz = tz;

		// Normalize by inter-ocular scale
		descriptor.push(Number((rx / scale).toFixed(5)));
		descriptor.push(Number((ry / scale).toFixed(5)));
		descriptor.push(Number((rz / scale).toFixed(5)));
	}

	return descriptor;
}

/**
 * Computes mean landmark distance between candidate and stored face descriptors.
 */
export function compareFaceDescriptors(candidate, stored, aspectCandidate = null, aspectStored = null) {
	const candidateVec = Array.isArray(candidate) && typeof candidate[0] === 'object'
		? buildFaceDescriptor(candidate, aspectCandidate)
		: candidate;
	const storedVec = Array.isArray(stored) && typeof stored[0] === 'object'
		? buildFaceDescriptor(stored, aspectStored)
		: stored;

	if (!Array.isArray(candidateVec) || !Array.isArray(storedVec)) {
		return Number.POSITIVE_INFINITY;
	}

	if (!candidateVec.length || candidateVec.length !== storedVec.length) {
		return Number.POSITIVE_INFINITY;
	}

	let totalDistance = 0;
	const numPoints = candidateVec.length / 3;

	for (let i = 0; i < candidateVec.length; i += 3) {
		const dx = Number(candidateVec[i]) - Number(storedVec[i]);
		const dy = Number(candidateVec[i + 1]) - Number(storedVec[i + 1]);
		const dz = Number(candidateVec[i + 2]) - Number(storedVec[i + 2]);

		totalDistance += Math.sqrt(dx * dx + dy * dy + dz * dz);
	}

	return totalDistance / numPoints;
}

export function euclideanDistance(candidate, stored) {
	return compareFaceDescriptors(candidate, stored);
}

export function isFaceMatch(candidate, stored, threshold = DEFAULT_FACE_MATCH_THRESHOLD) {
	const distance = compareFaceDescriptors(candidate, stored);
	return {
		match: distance <= threshold,
		distance,
		threshold,
	};
}