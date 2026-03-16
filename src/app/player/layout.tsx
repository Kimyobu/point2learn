'use client';
import { apiFetch } from '@/lib/apiClient';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getToken, clearToken } from '@/lib/sessionDB';
import { PlayerUserContext, type PlayerUser } from '@/context/PlayerUser';

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<PlayerUser | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        try {
            const res = await apiFetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                if (data.user?.role === 'PLAYER') {
                    setUser(data.user);
                    return;
                }
            }
            // authenticated but wrong role, or refresh failed (apiFetch handles 401 redirect)
            if (res.ok) router.push('/login');
        } catch (err) {
            console.error('PlayerLayout Auth Error:', err);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const handleLogout = async () => {
        const refreshToken = await getToken();
        localStorage.removeItem('session_token');
        await clearToken();
        await apiFetch('/api/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refreshToken })
        });
        router.push('/login');
    };

    if (loading || !user) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading... 💖</div>;
    }

    const themeStyle = user?.themeColor ? {
        '--primary': user.themeColor,
        '--primary-dark': user.themeColor,
        '--primary-light': `${user.themeColor}33`,
    } as React.CSSProperties : {};

    const getLinkStyle = (path: string) => ({
        padding: '8px 16px',
        fontSize: '0.9rem',
        borderRadius: 'var(--radius-sm)',
        textDecoration: 'none',
        color: pathname === path ? 'var(--primary-dark)' : 'var(--text-color)',
        background: pathname === path ? 'var(--primary-light)' : 'transparent',
        fontWeight: pathname === path ? 'bold' : 'normal',
        transition: 'all 0.2s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        minWidth: 'max-content'
    });

    const displayUsername = user?.displayName || user?.username || 'Player';

    return (
        <PlayerUserContext.Provider value={{ user, refreshUser: fetchUser }}>
            <div style={{ ...themeStyle, maxWidth: '1000px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <header style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '20px 24px', background: 'var(--surface)',
                    borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)', position: 'sticky', top: 0, zIndex: 10,
                    flexWrap: 'wrap', gap: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="title" style={{ fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => router.push('/player')}>P2L 💖</div>
                        <div className="badge badge-points">คะแนน: {user.points ?? 0} pt</div>
                    </div>
                    <nav style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                        <Link href="/player" style={getLinkStyle('/player')}>ภารกิจ 📝</Link>
                        <Link href="/player/history" style={getLinkStyle('/player/history')}>ประวัติ 📖</Link>
                        <Link href="/player/store" style={getLinkStyle('/player/store')}>ร้านค้า 🎁</Link>
                        <Link href="/player/profile" style={getLinkStyle('/player/profile')}>
                            {displayUsername}
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="avatar" style={{ width: 24, height: 24, borderRadius: '50%', display: 'inline-block', verticalAlign: 'middle', background: user.avatarBg || 'transparent' }} />
                            ) : (
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: user.avatarBg || 'var(--primary-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', verticalAlign: 'middle' }}>👤</div>
                            )}
                        </Link>
                        <button onClick={handleLogout} style={{ ...getLinkStyle(''), color: 'var(--danger)', marginLeft: '8px', minWidth: 'max-content' }}>
                            ออกระบบ
                        </button>
                    </nav>
                </header>

                <main style={{ flex: 1, padding: '24px' }}>
                    {children}
                </main>
            </div>
        </PlayerUserContext.Provider>
    );
}
