import mongoose from 'mongoose';

export default async function connectDB() {
	const mongoUri = process.env.MONGO_URI;
	if (!mongoUri) {
		throw new Error('MONGO_URI is missing in environment variables');
	}

	const conn = await mongoose.connect(mongoUri);
	console.log(`MongoDB Connected: ${conn.connection.host}`);
	return conn;
}
