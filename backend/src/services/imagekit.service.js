import ImageKit from '@imagekit/nodejs';

let imagekitClient = null;

function inferExtensionFromMimeType(mimeType) {
	if (!mimeType) return '';
	const m = String(mimeType).toLowerCase();
	if (m === 'image/jpeg' || m === 'image/jpg') return '.jpg';
	if (m === 'image/png') return '.png';
	if (m === 'image/webp') return '.webp';
	if (m === 'image/gif') return '.gif';
	if (m === 'image/bmp') return '.bmp';
	if (m === 'image/tiff') return '.tiff';
	return '';
}

function ensureFileNameHasExtension(fileName, mimeType) {
	const name = String(fileName || '').trim();
	if (!name) return `upload${inferExtensionFromMimeType(mimeType) || ''}`;
	// If a dot exists after the last path separator, assume an extension is present.
	const lastSlash = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
	const lastDot = name.lastIndexOf('.');
	if (lastDot > lastSlash) return name;
	return `${name}${inferExtensionFromMimeType(mimeType) || ''}`;
}

function bufferToDataUri(fileBuffer, mimeType) {
	if (!fileBuffer) return null;
	const type = mimeType || 'application/octet-stream';
	// ImageKit accepts data URIs; using this avoids content-type guessing issues.
	const base64 = Buffer.isBuffer(fileBuffer)
		? fileBuffer.toString('base64')
		: Buffer.from(fileBuffer).toString('base64');
	return `data:${type};base64,${base64}`;
}

function getImageKitClient() {
	if (imagekitClient) return imagekitClient;

	const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
	const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
	const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

	if (!publicKey || !privateKey || !urlEndpoint) {
		throw new Error(
			'ImageKit is not configured. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT in backend/.env and restart the server.'
		);
	}

	imagekitClient = new ImageKit({ publicKey, privateKey, urlEndpoint });
	return imagekitClient;
}

export async function uploadStudentPhoto({ fileBuffer, fileName, folder, mimeType } = {}) {
	const ik = getImageKitClient();

	const safeFileName = ensureFileNameHasExtension(fileName, mimeType);
	const dataUri = bufferToDataUri(fileBuffer, mimeType);

	const res = await ik.files.upload({
		file: dataUri || fileBuffer,
		fileName: safeFileName,
		folder: folder || '/hostelqr/students',
		useUniqueFileName: true,
	});

	return {
		url: res.url,
		fileId: res.fileId,
		name: res.name,
	};
}
