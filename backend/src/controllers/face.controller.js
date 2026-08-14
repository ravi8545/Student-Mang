import Student from '../models/student.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
	buildFaceDescriptor,
	euclideanDistance,
	isFaceMatch,
	sanitizeFaceLandmarks,
} from '../utils/face.js';

const DUPLICATE_FACE_THRESHOLD = 0.28;

function getFacePayload(req) {
	return {
		faceLandmarks: req.body?.faceLandmarks,
		faceImageDataUrl: req.body?.faceImageDataUrl || null,
		aspectRatio: Number(req.body?.aspectRatio) || null,
	};
}

// POST /api/face/register (student)
export const registerFace = asyncHandler(async (req, res) => {
	const { faceLandmarks, faceImageDataUrl, aspectRatio } = getFacePayload(req);
	const cleanedLandmarks = sanitizeFaceLandmarks(faceLandmarks);
	const faceDescriptor = buildFaceDescriptor(cleanedLandmarks, aspectRatio);

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

	const existingStudents = await Student.find({
		_id: { $ne: student._id },
		$or: [
			{ 'faceLandmarks.0': { $exists: true } },
			{ 'faceDescriptor.0': { $exists: true } },
		],
	})
		.select('_id faceDescriptor faceLandmarks')
		.lean();

	for (const other of existingStudents) {
		const otherDescriptor = (Array.isArray(other.faceLandmarks) && other.faceLandmarks.length >= 10)
			? buildFaceDescriptor(other.faceLandmarks)
			: other.faceDescriptor;

		const distance = euclideanDistance(faceDescriptor, otherDescriptor);
		if (distance < DUPLICATE_FACE_THRESHOLD) {
			return res.status(409).json({
				success: false,
				message: 'Face matches another already registered student account',
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
	const { faceLandmarks, aspectRatio } = getFacePayload(req);
	const candidateDescriptor = buildFaceDescriptor(faceLandmarks, aspectRatio);

	if (!candidateDescriptor.length) {
		return res.status(400).json({
			success: false,
			message: 'A valid face capture is required',
		});
	}

	const students = await Student.find({
		$or: [
			{ 'faceLandmarks.0': { $exists: true } },
			{ 'faceDescriptor.0': { $exists: true } },
		],
	})
		.select('_id name rollNo email department roomNo hostelName photoUrl faceDescriptor faceLandmarks')
		.lean();

	if (!students.length) {
		return res.status(404).json({ success: false, message: 'No registered faces found in database' });
	}

	const scoredMatches = [];
	for (const student of students) {
		// Auto-rebuild descriptor with aspect ratio normalization for stored landmarks
		const storedDescriptor = (Array.isArray(student.faceLandmarks) && student.faceLandmarks.length >= 10)
			? buildFaceDescriptor(student.faceLandmarks)
			: student.faceDescriptor;

		const result = isFaceMatch(candidateDescriptor, storedDescriptor);
		scoredMatches.push({
			student,
			...result,
		});
	}

	// Sort matches by distance ascending (smallest distance = closest match)
	scoredMatches.sort((a, b) => a.distance - b.distance);

	const bestMatch = scoredMatches[0];
	const runnerUp = scoredMatches.length > 1 ? scoredMatches[1] : null;

	if (!bestMatch?.match) {
		return res.status(404).json({
			success: false,
			message: `Face not recognized. Distance: ${bestMatch?.distance !== undefined && Number.isFinite(bestMatch.distance) ? bestMatch.distance.toFixed(3) : 'N/A'}`,
			distance: bestMatch?.distance ?? null,
			threshold: bestMatch?.threshold ?? null,
		});
	}

	// Ambiguity check: if runner up is also very close (margin < 0.04), require a clearer angle/lighting
	if (runnerUp && runnerUp.distance <= 0.30 && (runnerUp.distance - bestMatch.distance) < 0.04) {
		return res.status(400).json({
			success: false,
			message: 'Multiple close face matches detected. Please center the student face clearly in frame and try again.',
			distance: bestMatch.distance,
			margin: runnerUp.distance - bestMatch.distance,
		});
	}

	return res.json({
		success: true,
		message: 'Face matched successfully',
		studentId: String(bestMatch.student._id),
		distance: bestMatch.distance,
		threshold: bestMatch.threshold,
		student: {
			id: bestMatch.student._id,
			name: bestMatch.student.name,
			rollNo: bestMatch.student.rollNo,
			email: bestMatch.student.email,
			department: bestMatch.student.department,
			roomNo: bestMatch.student.roomNo,
			hostelName: bestMatch.student.hostelName,
			photoUrl: bestMatch.student.photoUrl || null,
		},
	});
});