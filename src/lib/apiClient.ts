import { getToken, saveToken, clearToken } from '@/lib/sessionDB';

/**
 * Standard API Client (Interceptor Pattern)
 * Use this wrapper instead of global `fetch()` for all `/api/*` calls.
 * 
 * Features:
 * 1. Automatically attaches `Authorization: Bearer <token>` from localStorage.
 * 2. On `401 Unauthorized`, it attempts a Silent Refresh via IndexedDB.
 * 3. If refresh succeeds, it retries the failed request automatically.
 * 4. Safe for Next.js App Router (Replaces buggy `window.fetch` monkey-patching).
 */

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // 1. Get access token from memory/localStorage
    let accessToken = typeof window !== 'undefined' ? localStorage.getItem('session_token') : null;

    // 2. Prepare headers
    const headers = new Headers(init?.headers);
    if (accessToken && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${accessToken}`);
    }

    // 3. Initial request
    const response = await fetch(input, { ...init, headers });

    // 4. Handle 401 Unauthorized (Trigger Silent Refresh)
    if (response.status === 401 && typeof window !== 'undefined') {
        const urlStr = typeof input === 'string' ? input : input.toString();

        // Avoid infinite loops if the refresh endpoint itself returns 401
        if (!urlStr.includes('/auth/refresh') && !urlStr.includes('/auth/login')) {

            // Queue refresh so multiple concurrent 401s don't hammer the API
            if (!isRefreshing) {
                isRefreshing = true;
                refreshPromise = silentRefresh();
            }

            const newAccessToken = await refreshPromise;

            if (newAccessToken) {
                // Refresh succeeded! Retry the original request
                const retryHeaders = new Headers(init?.headers);
                retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);
                return fetch(input, { ...init, headers: retryHeaders });
            } else {
                // Refresh failed (token expired/invalid). Force logout.
                localStorage.removeItem('session_token');
                await clearToken();

                // Redirect to login if not already there
                if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
                    window.location.href = '/login';
                }
            }
        }
    }

    return response;
}

/**
 * Silent Refresh Logic
 * Reads refreshToken from IndexedDB and exchanges it for a new pair.
 */
async function silentRefresh(): Promise<string | null> {
    try {
        const refreshToken = await getToken();
        if (!refreshToken) {
            isRefreshing = false;
            return null;
        }

        const res = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) {
            await clearToken();
            isRefreshing = false;
            return null;
        }

        const data = await res.json();

        // Save new tokens
        await saveToken(data.refreshToken);
        localStorage.setItem('session_token', data.accessToken);

        isRefreshing = false;
        return data.accessToken;
    } catch (e) {
        console.warn('[apiClient] silentRefresh network fail:', e);
        isRefreshing = false;
        return null; // Could be offline
    }
}
