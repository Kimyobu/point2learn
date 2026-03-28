'use client';
import { apiFetch } from '@/lib/apiClient';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveToken, getToken, clearToken } from '@/lib/sessionDB';
import { siteConfig } from '@/config/site';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const router = useRouter();

    // ตรวจ session ก่อนแสดง login form
    useEffect(() => {
        const checkExistingSession = async () => {
            try {
                const stored = localStorage.getItem('session_token');

                // ลอง check session ด้วย access token ที่มีอยู่
                const res = await fetch('/api/auth/me', {
                    headers: stored ? { 'Authorization': `Bearer ${stored}` } : {}
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.isAuthenticated && data.user) {
                        // Session ยังดีอยู่ → redirect เลย
                        if (data.user.role === 'ADMIN') {
                            router.replace('/admin');
                        } else {
                            router.replace('/player');
                        }
                        return;
                    }
                }

                // Access token หมดอายุ → ลอง silent refresh ด้วย refresh token จาก IndexedDB
                const refreshToken = await getToken();
                if (refreshToken) {
                    const refreshRes = await fetch('/api/auth/refresh', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refreshToken }),
                    });

                    if (refreshRes.ok) {
                        const refreshData = await refreshRes.json();
                        await saveToken(refreshData.refreshToken);
                        localStorage.setItem('session_token', refreshData.accessToken);

                        if (refreshData.user?.role === 'ADMIN') {
                            router.replace('/admin');
                        } else {
                            router.replace('/player');
                        }
                        return;
                    } else {
                        // Refresh token หมดอายุ → ล้างทิ้ง
                        await clearToken();
                        localStorage.removeItem('session_token');
                    }
                }
            } catch (e) {
                // network error หรือ offline — แสดง login form ตามปกติ
            } finally {
                setCheckingAuth(false);
            }
        };

        checkExistingSession();
    }, [router]);


    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok) {
                // Save tokens for iOS PWA persistence
                if (data.refreshToken) {
                    await saveToken(data.refreshToken);
                }
                if (data.accessToken) {
                    localStorage.setItem('session_token', data.accessToken);
                }

                if (data.user.role === 'ADMIN') {
                    router.push('/admin');
                } else {
                    router.push('/player');
                }
            } else {
                setError(data.error || siteConfig.login.loginFailed);
            }
        } catch (err) {
            setError(siteConfig.login.errorDefault);
        } finally {
            setLoading(false);
        }
    };

    if (checkingAuth) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div style={{ fontSize: '2rem', opacity: 0.5 }}>✨</div>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '24px'
        }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <div className="animate-float" style={{ fontSize: '4rem', marginBottom: '16px' }}>✨</div>
                <h1 className="title" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{siteConfig.login.headline}</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '1.1rem' }}>
                    {siteConfig.login.subheadline}
                </p>

                {error && (
                    <div style={{
                        background: '#ffe3e3',
                        color: 'var(--danger)',
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '24px',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder={siteConfig.login.usernamePlaceholder}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoComplete="username"
                    />
                    <input
                        type="password"
                        className="input-field"
                        placeholder={siteConfig.login.passwordPlaceholder}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                    />

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ marginTop: '8px' }}
                        disabled={loading}
                    >
                        {loading ? siteConfig.login.loginLoading : siteConfig.login.loginButton}
                    </button>
                </form>
            </div>
        </div>
    );
}
