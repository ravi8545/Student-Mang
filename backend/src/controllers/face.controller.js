import Student from '../models/student.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
	buildFaceDescriptor,
	euclideanDistance,
	isFaceMatch,
	sanitizeFaceLandmarks,
} from '../utils/face.js';

const DUPLICATE_FACE_THRESHOLD = 0.35;

function getFacePayload(req) {
	return {
		faceLandmarks: req.body?.faceLandmarks,
		faceImageDataUrl: req.body?.faceImageDataUrl || null,
	};
}

// POST /api/face/register (student)
export const registerFace = asyncHandler(async (req, res) => {
	const { faceLandmarks, faceImageDataUrl } = getFacePayload(req);
	const cleanedLandmarks = sanitizeFaceLandmarks(faceLandmarks);
	const faceDescriptor = buildFaceDescriptor(cleanedLandmarks);

	if (!cleanedLandmarks.length || !faceDescriptor.length) {
		return res.status(400).json({
			success: false,
			message: 'A valid face capture is required',
		});
	}

	const student = await Student.findById(req.user.id).select('-password');
	if (!student) {
		return res.status(404).json({ success: false, message: 'Student not found' });
	}

	// Check for duplicate faces among other students
	const existingStudents = await Student.find({
		_id: { $ne: student._id },
		'faceLandmarks.0': { $exists: true },
	})
		.select('_id faceLandmarks')
		.lean();

	for (const other of existingStudents) {
		if (!Array.isArray(other.faceLandmarks) || other.faceLandmarks.length < 10) continue;
		const otherDescriptor = buildFaceDescriptor(other.faceLandmarks);
		if (!otherDescriptor.length) continue;

		const distance = euclideanDistance(faceDescriptor, otherDescriptor);
		if (distance < DUPLICATE_FACE_THRESHOLD) {
			return res.status(409).json({
				success: false,
				message: 'This face is too similar to another registered student.',
			});
		}
	}

	student.faceLandmarks = cleanedLandmarks;
	student.faceDescriptor = faceDescriptor;
	student.faceImageDataUrl = faceImageDataUrl || null;
	student.faceRegisteredAt = new Date();
	await student.save();

	return res.json({
		success: true,
		message: 'Face registered successfully',
		student: {
			id: student._id,
			name: student.name,
			rollNo: student.rollNo,
			email: student.email,
			faceRegisteredAt: student.faceRegisteredAt,
		},
	});
});

// POST /api/face/verify (admin)
export const verifyFace = asyncHandler(async (req, res) => {
	const { faceLandmarks } = getFacePayload(req);
	const candidateDescriptor = buildFaceDescriptor(faceLandmarks);

	if (!candidateDescriptor.length) {
		return res.status(400).json({
			success: false,
			message: 'A valid face capture is required',
		});
	}

	// Only fetch students who have raw faceLandmarks stored
	const students = await Student.find({
		'faceLandmarks.0': { $exists: true },
	})
		.select('_id name rollNo email department roomNo hostelName photoUrl faceLandmarks')
		.lean();

	if (!students.length) {
		return res.status(404).json({
			success: false,
			message: 'No registered faces found in database',
		});
	}

	// Build descriptor from raw landmarks for EVERY student at comparison time.
	// This guarantees both sides use the exact same algorithm.
	const scored = [];
	for (const student of students) {
		if (!Array.isArray(student.faceLandmarks) || student.faceLandmarks.length < 10) continue;

		const storedDesc = buildFaceDescriptor(student.faceLandmarks);
		if (!storedDesc.length || storedDesc.length !== candidateDescriptor.length) continue;

		const result = isFaceMatch(candidateDescriptor, storedDesc);
		scored.push({ student, ...result });
	}

	if (!scored.length) {
		return res.status(404).json({
			success: false,
			message: 'No valid face descriptors found in database. Students may need to re-register.',
		});
	}

	scored.sort((a, b) => a.distance - b.distance);
	const best = scored[0];

	console.log(
		`[face-verify] best=${best.student.name} dist=${best.distance.toFixed(4)} threshold=${best.threshold} match=${best.match}`,
	);

	if (!best.match) {
		return res.status(404).json({
			success: false,
			message: `Face not recognized. Distance: ${best.distance.toFixed(3)} (threshold ${best.threshold})`,
			distance: best.distance,
			threshold: best.threshold,
		});
	}

	// Ambiguity guard
	const runnerUp = scored.length > 1 ? scored[1] : null;
	if (runnerUp && runnerUp.match && (runnerUp.distance - best.distance) < 0.06) {
		return res.status(400).json({
			success: false,
			message: 'Ambiguous match — two students look too similar at this angle. Please try again with clearer framing.',
			distance: best.distance,
			margin: runnerUp.distance - best.distance,
		});
	}

	return res.json({
		success: true,
		message: 'Face matched successfully',
		studentId: String(best.student._id),
		distance: best.distance,
		threshold: best.threshold,
		student: {
			id: best.student._id,
			name: best.student.name,
			rollNo: best.student.rollNo,
			email: best.student.email,
			department: best.student.department,
			roomNo: best.student.roomNo,
			hostelName: best.student.hostelName,
			photoUrl: best.student.photoUrl || null,
		},
	});
});