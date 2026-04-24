import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// React dev server runs on :3000 and proxies API calls to the backend on :5000.
export default defineConfig({
	plugins: [react()],
	server: {
		port: 3000,
		proxy: {
			'/api': 'http://localhost:5000',
		},
	},
});
