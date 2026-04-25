import multer from 'multer';

const MAX_FILE_SIZE_BYTES = Number(process.env.MAX_PHOTO_UPLOAD_BYTES || 3 * 1024 * 1024);

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: MAX_FILE_SIZE_BYTES },
	fileFilter: (req, file, cb) => {
		const ok = Boolean(file?.mimetype?.startsWith('image/'));
		if (!ok) return cb(new Error('Only image files are allowed'));
		return cb(null, true);
	},
});

// Middleware helper to accept an optional single image file.
export function uploadSingleImage(fieldName) {
	const handler = upload.single(fieldName);
	return (req, res, next) => {
		handler(req, res, (err) => {
			if (!err) return next();
			return res.status(400).json({
				success: false,
				message: err?.message || 'File upload failed',
			});
		});
	};
}
