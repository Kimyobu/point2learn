'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getToken, saveToken, clearToken } from '@/lib/sessionDB';

/**
 * SessionProvider (Replaces AuthProvider)
 * 
 * 1. NO LONGER patches global fetch (which breaks Next.js App Router).
 * 2. Only listens to `visibilitychange` to eagerly rehydrate session when app resumes.
 * 3. Graceful failover: redirect to /login if refresh fails.
 * 
 * NOTE: For API calls, components must now use `apiFetch` from `@/lib/apiClient` instead of `fetch`.
 */
export default function SessionProvider({ children }: { children: React.ReactNode }) {
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

            const res = await fetch('/api/auth/refresh', {
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

            // Save new tokens
            await saveToken(data.refreshToken);
            localStorage.setItem('session_token', data.accessToken);

            isRefreshingRef.current = false;
            return true;
        } catch (e) {
            console.warn('[SessionProvider] silentRefresh failed:', e);
            isRefreshingRef.current = false;
            return false;
        }
    }, []);

    useEffect(() => {
        // Initialize: try to load session on boot
        const initSession = async () => {
            const stored = localStorage.getItem('session_token');

            try {
                // Test session health (use standard fetch to avoid loop if apiFetch is used)
                const res = await fetch('/api/auth/me', {
                    headers: stored ? { 'Authorization': `Bearer ${stored}` } : {}
                });

                if (!res.ok) {
                    // Session expired or missing — try silent refresh
                    const refreshed = await silentRefresh();
                    if (!refreshed && pathname !== '/login' && pathname !== '/') {
                        router.push('/login');
                    }
                }
            } catch (e) {
                // Network error — don't redirect, could be offline
            }
        };

        // visibilitychange: rehydrate when app comes back from background (PWA behavior)
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
                const stored = localStorage.getItem('session_token');

                try {
                    const res = await fetch('/api/auth/me', {
                        headers: stored ? { 'Authorization': `Bearer ${stored}` } : {},
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

        // Don't init session on login page or landing page
        if (pathname !== '/login' && pathname !== '/') {
            initSession();
        }

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [silentRefresh, pathname, router]);

    return <>{children}</>;
}
