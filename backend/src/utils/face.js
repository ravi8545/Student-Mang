const DEFAULT_FACE_MATCH_THRESHOLD = Number(process.env.FACE_MATCH_THRESHOLD || 0.08);

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

export function buildFaceDescriptor(landmarks) {
	const points = sanitizeFaceLandmarks(landmarks);
	if (!points.length) return [];

	const xs = points.map((point) => point.x);
	const ys = points.map((point) => point.y);
	const zs = points.map((point) => point.z);
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);
	const minZ = Math.min(...zs);
	const maxZ = Math.max(...zs);
	const scale = Math.max(maxX - minX, maxY - minY, maxZ - minZ, 1e-6);

	const descriptor = [];
	for (const point of points) {
		descriptor.push(Number(((point.x - minX) / scale).toFixed(6)));
		descriptor.push(Number(((point.y - minY) / scale).toFixed(6)));
		descriptor.push(Number(((point.z - minZ) / scale).toFixed(6)));
	}

	return descriptor;
}

export function compareFaceDescriptors(candidate, stored) {
	if (!Array.isArray(candidate) || !Array.isArray(stored)) {
		return Number.POSITIVE_INFINITY;
	}

	if (!candidate.length || candidate.length !== stored.length) {
		return Number.POSITIVE_INFINITY;
	}

	let totalDifference = 0;
	for (let index = 0; index < candidate.length; index += 1) {
		totalDifference += Math.abs(Number(candidate[index]) - Number(stored[index]));
	}

	return totalDifference / candidate.length;
}

export function isFaceMatch(candidate, stored, threshold = DEFAULT_FACE_MATCH_THRESHOLD) {
	const distance = compareFaceDescriptors(candidate, stored);
	return {
		match: distance <= threshold,
		distance,
		threshold,
	};
}