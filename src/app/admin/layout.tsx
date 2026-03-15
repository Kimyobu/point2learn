'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkAuth() {
            try {
                const res = await fetch('/api/auth/me');
                if (!res.ok) throw new Error('Not auth');
                const data = await res.json();
                if (data.user.role !== 'ADMIN') {
                    router.push('/login');
                } else {
                    setUser(data.user);
                }
            } catch (err) {
                router.push('/login');
            } finally {
                setLoading(false);
            }
        }
        checkAuth();
    }, [pathname, router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    if (loading || !user) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Admin... 🛡️</div>;
    }

    const getLinkStyle = (path: string) => ({
        padding: '8px 16px',
        borderRadius: 'var(--radius-sm)',
        background: pathname === path ? 'var(--primary)' : 'transparent',
        color: pathname === path ? 'white' : 'var(--text-main)',
        fontWeight: 600
    });

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '20px 24px', background: 'var(--surface)',
                borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)', position: 'sticky', top: 0, zIndex: 10,
                flexWrap: 'wrap', gap: '16px'
            }}>
                <div className="title" style={{ fontSize: '1.5rem', flexShrink: 0 }}>🛡️ Admin Panel</div>
                <nav style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    <Link href="/admin" style={getLinkStyle('/admin')}>ตรวจงาน ✉️</Link>
                    <Link href="/admin/tasks" style={getLinkStyle('/admin/tasks')}>จัดการภารกิจ 📝</Link>
                    <Link href="/admin/history" style={getLinkStyle('/admin/history')}>ประวัติ 📋</Link>
                    <Link href="/admin/store" style={getLinkStyle('/admin/store')}>จัดการร้านค้า 🎁</Link>
                    <Link href="/admin/messages" style={getLinkStyle('/admin/messages')}>จดหมายลับ 💌</Link>
                    <Link href="/admin/db" style={getLinkStyle('/admin/db')}>ฐานข้อมูล 🗄️</Link>
                    <Link href="/admin/files" style={getLinkStyle('/admin/files')}>ไฟล์ 📂</Link>
                    <Link href="/admin/account" style={getLinkStyle('/admin/account')}>ตั้งค่าบัญชี ⚙️</Link>
                    <button onClick={handleLogout} style={{ ...getLinkStyle(''), color: 'var(--danger)', marginLeft: '8px', minWidth: 'max-content' }}>
                        ออกระบบ
                    </button>
                </nav>
            </header>

            <main style={{ flex: 1, padding: '24px' }}>
                {children}
            </main>
        </div>
    );
}
