import axios from 'axios';
import { getAuth } from './authStorage';

export const api = axios.create({
	baseURL: '/api',
});

// Attach JWT automatically.
api.interceptors.request.use((config) => {
	const { token } = getAuth();
	if (token) {
		config.headers = config.headers || {};
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});
