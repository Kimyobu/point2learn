'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getToken, saveToken, clearToken } from '@/lib/sessionDB';

/**
 * AuthProvider — Persistent iOS PWA Session
 *
 * 1. Patches global fetch to attach accessToken as Authorization header
 * 2. Listens to `visibilitychange` to rehydrate session when app resumes
 * 3. Uses IndexedDB (via sessionDB) for persistent refreshToken storage
 * 4. Graceful failover: redirect to /login if refresh fails
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const accessTokenRef = useRef<string | null>(null);
    const isRefreshingRef = useRef(false);
    const router = useRouter();
    const pathname = usePathname();

    // Silent refresh: use IndexedDB refreshToken to get new tokens
    const silentRefresh = useCallback(async (): Promise<boolean> => {
        if (isRefreshingRef.current) return false;
        isRefreshingRef.current = true;

        try {
            const refreshToken = await getToken();
            if (!refreshToken) {
                isRefreshingRef.current = false;
                return false;
            }

            const res = await window._originalFetch('/api/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (!res.ok) {
                // Refresh token invalid/expired — clear and fail
                await clearToken();
                isRefreshingRef.current = false;
                return false;
            }

            const data = await res.json();
            accessTokenRef.current = data.accessToken;
            await saveToken(data.refreshToken);

            // Also keep in localStorage as additional fallback
            try { localStorage.setItem('session_token', data.accessToken); } catch (e) { }

            isRefreshingRef.current = false;
            return true;
        } catch (e) {
            console.warn('[AuthProvider] silentRefresh failed:', e);
            isRefreshingRef.current = false;
            return false;
        }
    }, []);

    useEffect(() => {
        // Store original fetch before any patching
        if (!window._originalFetch) {
            window._originalFetch = window.fetch.bind(window);
        }
        const originalFetch = window._originalFetch;

        // Patch global fetch to attach accessToken
        window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            const token = accessTokenRef.current || localStorage.getItem('session_token');

            if (token) {
                const headers = new Headers(init?.headers);
                if (!headers.has('Authorization')) {
                    headers.set('Authorization', `Bearer ${token}`);
                }
                init = { ...init, headers };
            }

            const response = await originalFetch(input, init);

            // If we get a 401 on an API call, try silent refresh once
            if (response.status === 401 && typeof input === 'string' && input.startsWith('/api/') && !input.includes('/auth/refresh')) {
                const refreshed = await silentRefresh();
                if (refreshed) {
                    // Retry the original request with new token
                    const retryHeaders = new Headers(init?.headers);
                    retryHeaders.set('Authorization', `Bearer ${accessTokenRef.current}`);
                    return originalFetch(input, { ...init, headers: retryHeaders });
                }
            }

            return response;
        };

        // Initialize: try to load accessToken from localStorage, then validate
        const initSession = async () => {
            const stored = localStorage.getItem('session_token');
            if (stored) {
                accessTokenRef.current = stored;
            }

            // Check if session is still valid
            try {
                const res = await window.fetch('/api/auth/me');
                if (!res.ok) {
                    // Session expired — try silent refresh
                    const refreshed = await silentRefresh();
                    if (!refreshed && pathname !== '/login' && pathname !== '/') {
                        router.push('/login');
                    }
                }
            } catch (e) {
                // Network error — don't redirect, could be offline
            }
        };

        // visibilitychange: rehydrate when app comes back
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
                // Test session health
                try {
                    const res = await originalFetch('/api/auth/me', {
                        headers: accessTokenRef.current
                            ? { 'Authorization': `Bearer ${accessTokenRef.current}` }
                            : {},
                    });

                    if (!res.ok) {
                        const refreshed = await silentRefresh();
                        if (!refreshed && pathname !== '/login' && pathname !== '/') {
                            router.push('/login');
                        }
                    }
                } catch (e) {
                    // Offline — don't redirect
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Don't init session on login page
        if (pathname !== '/login' && pathname !== '/') {
            initSession();
        }

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.fetch = originalFetch;
        };
    }, [silentRefresh, pathname, router]);

    return <>{children}</>;
}

// Extend Window to store original fetch
declare global {
    interface Window {
        _originalFetch: typeof fetch;
    }
}
