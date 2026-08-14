/**
 * Face descriptor utility for MediaPipe 478-point face mesh.
 *
 * Algorithm:
 *   1. Translate all landmarks so nose-tip (index 1) is the origin.
 *   2. Compute 2D roll angle from left-eye-center to right-eye-center.
 *   3. Rotate all points to de-roll (eyes become horizontally aligned).
 *   4. Scale all coordinates by inter-ocular distance so the descriptor
 *      is size/distance invariant.
 *   5. Flatten to a 1-D vector [x0, y0, z0, x1, y1, z1, ...].
 *
 * The descriptor is purely geometric — no aspect-ratio heuristics,
 * no camera metadata needed. As long as both registration and verification
 * use the same MediaPipe model, the raw landmark coordinates are in the
 * same normalised [0,1]×[0,1] space, so the descriptors are comparable.
 */

const DEFAULT_FACE_MATCH_THRESHOLD = Number(process.env.FACE_MATCH_THRESHOLD || 0.55);

// Anatomically stable landmarks that carry the most identity signal.
// Weighted 3× during comparison to emphasise bone-structure over soft tissue.
const KEY_LANDMARK_INDICES = new Set([
	1, 4, 6, 168, 197,           // Nose tip & bridge
	33, 133, 159, 145,           // Left eye corners & lids
	362, 263, 386, 374,          // Right eye corners & lids
	70, 63, 105, 66, 107,       // Left eyebrow
	336, 296, 334, 293, 300,    // Right eyebrow
	234, 454, 127, 356,         // Cheekbones & temple
	152, 175,                    // Chin
	61, 291,                     // Mouth corners
]);

/* ------------------------------------------------------------------ */
/*  Sanitise raw landmark array from the client                       */
/* ------------------------------------------------------------------ */

export function sanitizeFaceLandmarks(landmarks) {
	if (!Array.isArray(landmarks)) return [];

	return landmarks
		.map((p) => ({
			x: Number(p?.x),
			y: Number(p?.y),
			z: Number(p?.z ?? 0),
		}))
		.filter(
			(p) =>
				Number.isFinite(p.x) &&
				Number.isFinite(p.y) &&
				Number.isFinite(p.z),
		);
}

/* ------------------------------------------------------------------ */
/*  Build a face descriptor from raw MediaPipe landmarks              */
/* ------------------------------------------------------------------ */

export function buildFaceDescriptor(landmarks) {
	const pts = sanitizeFaceLandmarks(landmarks);
	if (pts.length < 10) return [];

	// --- reference points ---
	const nose = pts[1] || pts[0];

	const lEye1 = pts[33]  || pts[0];
	const lEye2 = pts[133] || pts[0];
	const rEye1 = pts[362] || pts[pts.length - 1];
	const rEye2 = pts[263] || pts[pts.length - 1];

	const leftEye  = { x: (lEye1.x + lEye2.x) / 2, y: (lEye1.y + lEye2.y) / 2, z: (lEye1.z + lEye2.z) / 2 };
	const rightEye = { x: (rEye1.x + rEye2.x) / 2, y: (rEye1.y + rEye2.y) / 2, z: (rEye1.z + rEye2.z) / 2 };

	// inter-ocular distance → scale factor
	const dx = rightEye.x - leftEye.x;
	const dy = rightEye.y - leftEye.y;
	const dz = rightEye.z - leftEye.z;
	const iod = Math.sqrt(dx * dx + dy * dy + dz * dz);
	const scale = iod > 1e-6 ? iod : 0.1;

	// 2-D roll angle
	const roll = Math.atan2(dy, dx);
	const cos = Math.cos(-roll);
	const sin = Math.sin(-roll);

	const desc = new Array(pts.length * 3);
	for (let i = 0; i < pts.length; i++) {
		// translate so nose = origin
		const tx = pts[i].x - nose.x;
		const ty = pts[i].y - nose.y;
		const tz = pts[i].z - nose.z;

		// de-roll
		const rx = tx * cos - ty * sin;
		const ry = tx * sin + ty * cos;

		// scale-normalise
		desc[i * 3]     = rx / scale;
		desc[i * 3 + 1] = ry / scale;
		desc[i * 3 + 2] = tz / scale;
	}

	return desc;
}

/* ------------------------------------------------------------------ */
/*  Compare two descriptors (both must be flat number arrays)         */
/* ------------------------------------------------------------------ */

export function compareFaceDescriptors(a, b) {
	// auto-convert if someone passes raw landmark objects
	const va = Array.isArray(a) && a.length && typeof a[0] === 'object' ? buildFaceDescriptor(a) : a;
	const vb = Array.isArray(b) && b.length && typeof b[0] === 'object' ? buildFaceDescriptor(b) : b;

	if (!Array.isArray(va) || !Array.isArray(vb) || !va.length || va.length !== vb.length) {
		return Number.POSITIVE_INFINITY;
	}

	let wSum = 0;
	let wTotal = 0;

	for (let i = 0; i < va.length; i += 3) {
		const idx = i / 3;
		const ex = va[i]     - vb[i];
		const ey = va[i + 1] - vb[i + 1];
		const ez = va[i + 2] - vb[i + 2];
		const d  = Math.sqrt(ex * ex + ey * ey + ez * ez);

		const w = KEY_LANDMARK_INDICES.has(idx) ? 3.0 : 1.0;
		wSum   += d * w;
		wTotal += w;
	}

	return wTotal > 0 ? wSum / wTotal : Number.POSITIVE_INFINITY;
}

export function euclideanDistance(a, b) {
	return compareFaceDescriptors(a, b);
}

export function isFaceMatch(candidate, stored, threshold = DEFAULT_FACE_MATCH_THRESHOLD) {
	const distance = compareFaceDescriptors(candidate, stored);
	return { match: distance <= threshold, distance, threshold };
}