import QRCode from 'qrcode';

// Generates a QR Code that encodes { studentId } as JSON.
export async function generateStudentQrDataUrl(studentId) {
	const payload = JSON.stringify({ studentId });
	const dataUrl = await QRCode.toDataURL(payload, {
		errorCorrectionLevel: 'M',
		margin: 2,
		width: 280,
	});
	return { payload, dataUrl };
}
