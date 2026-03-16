'use client';
import { apiFetch } from '@/lib/apiClient';

import { useEffect, useState } from 'react';

type User = { id: string; username: string; role: string; points: number };

export default function AccountManagerPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const res = await apiFetch('/api/users');
        if (res.ok) {
            const data = await res.json();
            setUsers(data);
            if (data.length > 0) setSelectedUserId(data[0].id);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId || !newPassword) return;

        setLoading(true);
        const res = await apiFetch('/api/users/password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: selectedUserId, newPassword })
        });

        if (res.ok) {
            alert('เปลี่ยนรหัสผ่านสำเร็จ!');
            setNewPassword('');
        } else {
            alert('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
        }
        setLoading(false);
    };

    const targetUser = users.find(u => u.id === selectedUserId);

    return (
        <div className="animate-fade-in">
            <h1 className="title" style={{ fontSize: '2rem', marginBottom: '24px' }}>⚙️ จัดการบัญชี (Account Manager)</h1>

            <div className="card" style={{ marginBottom: '32px', maxWidth: '600px' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--primary-dark)' }}>รีเซ็ตรหัสผ่าน</h2>

                {users.length > 0 && (
                    <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-muted)' }}>เลือกบัญชีผู้ใช้</label>
                            <select
                                className="input-field"
                                value={selectedUserId}
                                onChange={e => setSelectedUserId(e.target.value)}
                            >
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.username} ({u.role === 'ADMIN' ? 'แอดมิน' : 'แฟน'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-muted)' }}>รหัสผ่านใหม่ (สำหรับ {targetUser?.username})</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="พิมพ์รหัสผ่านใหม่ที่นี่..."
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
                            {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
                        </button>
                    </form>
                )}
            </div>

            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-muted)' }}>รายชื่อบัญชีทั้งหมด</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px' }}>
                {users.map(u => (
                    <div key={u.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                        <div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{u.username}</h3>
                                <span className="badge" style={{ background: u.role === 'ADMIN' ? '#333' : 'var(--primary-light)', color: u.role === 'ADMIN' ? '#fff' : 'var(--primary-dark)' }}>{u.role}</span>
                            </div>
                        </div>
                        <span className="badge badge-points">{u.points} pt</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
