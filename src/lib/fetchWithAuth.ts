/**
 * Wrapper around fetch that automatically includes the session token
 * from localStorage as an Authorization header.
 * This solves the iOS PWA issue where cookies are cleared on force close.
 */
export async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('session_token') : null;

    const headers = new Headers(init?.headers);
    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    return fetch(input, { ...init, headers });
}

/**
 * Save session token from login response to localStorage
 */
export function saveSessionToken(token: string) {
    if (typeof window !== 'undefined') {
        localStorage.setItem('session_token', token);
    }
}

/**
 * Clear session token on logout
 */
export function clearSessionToken() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('session_token');
    }
}
