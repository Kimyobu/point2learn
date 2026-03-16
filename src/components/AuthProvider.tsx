'use client';

import { useEffect } from 'react';

/**
 * This component patches the global `fetch` to automatically attach
 * the session token from localStorage as an Authorization header.
 *
 * This solves the iOS PWA issue where httpOnly cookies are lost on force close.
 * The server-side getSession() checks both cookie and Authorization header.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const originalFetch = window.fetch.bind(window);

        window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            const token = localStorage.getItem('session_token');

            if (token) {
                const headers = new Headers(init?.headers);
                if (!headers.has('Authorization')) {
                    headers.set('Authorization', `Bearer ${token}`);
                }
                init = { ...init, headers };
            }

            return originalFetch(input, init);
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, []);

    return <>{children}</>;
}
