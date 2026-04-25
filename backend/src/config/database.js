import mongoose from 'mongoose';

export default async function connectDB() {
	const mongoUri = process.env.MONGO_URI;
	if (!mongoUri) {
		throw new Error('MONGO_URI is missing in environment variables');
	}

	const conn = await mongoose.connect(mongoUri);
	console.log(`MongoDB Connected: ${conn.connection.host}`);

	// Legacy migration: older versions used `verified` instead of `isVerified`.
	// Copy only the TRUE values so existing verified accounts can still log in.
	try {
		const students = conn.connection.db.collection('students');
		const res = await students.updateMany(
			{ isVerified: { $exists: false }, verified: true },
			{ $set: { isVerified: true } }
		);
		if (res?.modifiedCount) {
			console.log(`Migrated ${res.modifiedCount} student(s) to isVerified=true`);
		}
	} catch (err) {
		console.warn('Student verification migration skipped:', err?.message);
	}

	return conn;
}
