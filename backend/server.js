import 'dotenv/config';
import app from './src/app.js';
import connectDB from './src/config/database.js';

// Entry point for the backend API server.
const PORT = Number(process.env.PORT) || 5000;

try {
	await connectDB();
	app.listen(PORT, () => {
		console.log(`Backend is running on port ${PORT}`);
	});
} catch (err) {
	console.error('Failed to start server:', err);
	process.exit(1);
}
