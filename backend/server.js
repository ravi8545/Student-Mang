import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load backend/.env reliably even if the server is started from a different cwd.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const { default: app } = await import('./src/app.js');
const { default: connectDB } = await import('./src/config/database.js');

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
