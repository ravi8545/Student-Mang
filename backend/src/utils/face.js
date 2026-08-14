const DEFAULT_FACE_MATCH_THRESHOLD = Number(process.env.FACE_MATCH_THRESHOLD || 0.16);

export function sanitizeFaceLandmarks(landmarks) {
	if (!Array.isArray(landmarks)) return [];

	return landmarks
		.map((point) => ({
			x: Number(point?.x),
			y: Number(point?.y),
			z: Number(point?.z ?? 0),
		}))
		.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z));
}

/**
 * Builds an eye-centered, 2D-roll compensated, scale-invariant face descriptor vector.
 * Uses MediaPipe 478/468 landmark geometry.
 */
export function buildFaceDescriptor(landmarks) {
	const points = sanitizeFaceLandmarks(landmarks);
	if (!points.length || points.length < 10) return [];

	// Nose tip landmark index 1
	const nose = points[1] || points[0];

	// Left Eye (33, 133) & Right Eye (362, 263)
	const pLeft33 = points[33] || points[0];
	const pLeft133 = points[133] || points[0];
	const pRight362 = points[362] || points[points.length - 1];
	const pRight263 = points[263] || points[points.length - 1];

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
	for (const point of points) {
		// 1. Translate relative to nose tip
		const tx = point.x - nose.x;
		const ty = point.y - nose.y;
		const tz = point.z - nose.z;

		// 2. Rotate to align horizontal eye axis
		const rx = tx * cosTheta - ty * sinTheta;
		const ry = tx * sinTheta + ty * cosTheta;
		const rz = tz;

		// 3. Normalize by inter-ocular distance scale
		descriptor.push(Number((rx / scale).toFixed(6)));
		descriptor.push(Number((ry / scale).toFixed(6)));
		descriptor.push(Number((rz / scale).toFixed(6)));
	}

	return descriptor;
}

/**
 * Computes mean normalized distance between candidate and stored face descriptors.
 */
export function compareFaceDescriptors(candidate, stored) {
	if (!Array.isArray(candidate) || !Array.isArray(stored)) {
		return Number.POSITIVE_INFINITY;
	}

	if (!candidate.length || candidate.length !== stored.length) {
		return Number.POSITIVE_INFINITY;
	}

	let totalDistance = 0;
	const numPoints = candidate.length / 3;

	for (let i = 0; i < candidate.length; i += 3) {
		const dx = Number(candidate[i]) - Number(stored[i]);
		const dy = Number(candidate[i + 1]) - Number(stored[i + 1]);
		const dz = Number(candidate[i + 2]) - Number(stored[i + 2]);

		// Euclidean distance per 3D landmark
		totalDistance += Math.sqrt(dx * dx + dy * dy + dz * dz);
	}

	return totalDistance / numPoints;
}

export function euclideanDistance(candidate, stored, maxDistance = Number.POSITIVE_INFINITY) {
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