import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// React dev server runs on :3000 and proxies API calls to the backend on :5000.
export default defineConfig({
	plugins: [react()],
	server: {
		// Allow access from other devices on your LAN (e.g., mobile phone testing).
		host: true,
		port: 3000,
		// Fail fast if the port is already taken so you don't accidentally
		// send verification links pointing to the wrong port.
		strictPort: true,
		proxy: {
			'/api': 'http://localhost:5000',
		},
	},
});
