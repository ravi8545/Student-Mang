// Simple localStorage-based auth state.

const KEY = 'hees_auth';

export function getAuth() {
	try {
		const raw = localStorage.getItem(KEY);
		return raw ? JSON.parse(raw) : { token: null, role: null };
	} catch {
		return { token: null, role: null };
	}
}

export function setAuth({ token, role }) {
	localStorage.setItem(KEY, JSON.stringify({ token, role }));
}

export function clearAuth() {
	localStorage.removeItem(KEY);
}
