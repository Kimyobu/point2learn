'use client';
import { apiFetch } from '@/lib/apiClient';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveToken } from '@/lib/sessionDB';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await apiFetch('/api/auth/login', {
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
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
                <h1 className="title" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Point2Learn</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '1.1rem' }}>
                    Welcome back! Ready for your next mission?
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
                        placeholder="Username (e.g., player)"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoComplete="username"
                    />
                    <input
                        type="password"
                        className="input-field"
                        placeholder="Password (e.g., love123)"
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
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}
