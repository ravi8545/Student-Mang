import Student from '../models/student.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
	buildFaceDescriptor,
	euclideanDistance,
	isFaceMatch,
	sanitizeFaceLandmarks,
} from '../utils/face.js';

const DUPLICATE_FACE_THRESHOLD = 0.5;

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

	const existingDescriptors = await Student.find({
		_id: { $ne: student._id },
		'faceDescriptor.0': { $exists: true },
	})
		.select('_id faceDescriptor')
		.lean();

	for (const other of existingDescriptors) {
		const distance = euclideanDistance(faceDescriptor, other?.faceDescriptor, DUPLICATE_FACE_THRESHOLD);
		if (distance < DUPLICATE_FACE_THRESHOLD) {
			return res.status(409).json({
				success: false,
				message: 'Face already registered with another user',
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

	const students = await Student.find({ 'faceDescriptor.0': { $exists: true } })
		.select('_id name rollNo email department roomNo hostelName photoUrl faceDescriptor')
		.lean();

	if (!students.length) {
		return res.status(404).json({ success: false, message: 'No registered faces found' });
	}

	let bestMatch = null;
	for (const student of students) {
		const result = isFaceMatch(candidateDescriptor, student.faceDescriptor);
		if (!bestMatch || result.distance < bestMatch.distance) {
			bestMatch = {
				student,
				...result,
			};
		}
	}

	if (!bestMatch?.match) {
		return res.status(404).json({
			success: false,
			message: 'Face not recognized',
			distance: bestMatch?.distance ?? null,
			threshold: bestMatch?.threshold ?? null,
		});
	}

	return res.json({
		success: true,
		message: 'Face matched',
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