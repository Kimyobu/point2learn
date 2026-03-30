'use client';
import { apiFetch } from '@/lib/apiClient';
import Swal from 'sweetalert2';

import { useEffect, useState } from 'react';
import { usePlayerUser } from '@/context/PlayerUser';

const EMOJI_LIST = ['🐶', '🐱', '🐰', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐣', '🦄', '🐝', '🐛', '🦋', '🐢', '🐙', '🐬', '🐳', '🦖', '🐉', '👽', '👾', '🤖', '💩', '👻', '💀'];

export default function ProfilePage() {
    const { user: ctxUser, refreshUser } = usePlayerUser();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [passSaving, setPassSaving] = useState(false);

    const [avatarUrl, setAvatarUrl] = useState('');
    const [avatarBg, setAvatarBg] = useState('');
    const [themeColor, setThemeColor] = useState('#FF8BA7');
    const [displayName, setDisplayName] = useState('');
    const [username, setUsername] = useState('');

    // File upload
    const [uploading, setUploading] = useState(false);

    // Passwords
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        if (ctxUser) {
            setUser(ctxUser);
            setAvatarUrl(ctxUser.avatarUrl || '');
            setAvatarBg(ctxUser.avatarBg || 'var(--primary-light)');
            setThemeColor(ctxUser.themeColor || '#FF8BA7');
            setDisplayName(ctxUser.displayName || '');
            setUsername(ctxUser.username || '');
            setLoading(false);
        }
    }, [ctxUser]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        const res = await apiFetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();

        if (res.ok) {
            setAvatarUrl(data.url); // Use the uploaded file url
        } else {
            Swal.fire('ข้อผิดพลาด', 'อัปโหลดรูปไม่สำเร็จค่ะ', 'error');
        }
        setUploading(false);
    };

    const setEmojiAsAvatar = async (emoji: string) => {
        // Create an SVG data url to act as the avatar image
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${emoji}</text></svg>`;
        const url = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
        setAvatarUrl(url);
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const payload: any = { themeColor, displayName, username, avatarBg };

        // Pass avatarUrl as undefined or null properly but since prisma accepts string? 
        // we can pass url or an empty string which means they might have deleted it.
        // The problem before was we passed it without checks or the Prisma schema choked. 
        // Our api now safely extracts it via `avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined`.
        payload.avatarUrl = avatarUrl || null;

        const res = await apiFetch('/api/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok) {
            await Swal.fire('สำเร็จ', 'บันทึกโปรไฟล์สำเร็จ! (สีธีมจะเปลี่ยนหลังจากรีเฟรชหน้าเว็บนะคะ)', 'success');
            await refreshUser(); // อัปเดต layout header
            window.location.reload();
        } else {
            Swal.fire('ข้อผิดพลาด', data.error || 'เกิดข้อผิดพลาดในการบันทึกโปรไฟล์', 'error');
        }
        setSaving(false);
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassSaving(true);
        const res = await apiFetch('/api/users/password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldPassword, newPassword })
        });
        const data = await res.json();
        if (res.ok) {
            Swal.fire('สำเร็จ', 'เปลี่ยนรหัสผ่านสำเร็จค่ะ! 💖', 'success');
            setOldPassword('');
            setNewPassword('');
        } else {
            Swal.fire('ข้อผิดพลาด', data.error || 'รหัสผ่านเดิมไม่ถูกต้อง หรือเกิดข้อผิดพลาด', 'error');
        }
        setPassSaving(false);
    };

    if (loading || !user) return <div style={{ padding: '24px' }}>Loading Profile...</div>;

    return (
        <div className="animate-fade-in">
            <h1 className="title" style={{ fontSize: '2rem', marginBottom: '8px' }}>👤 โปรไฟล์ของฉัน</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>ปรับแต่งสีธีมหน้าเว็บและข้อมูลส่วนตัวได้ที่นี่เลยค่ะ</p>

            <div className="card" style={{ marginBottom: '32px', maxWidth: '600px' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ✨ ข้อมูลส่วนตัว & ตกแต่ง
                </h2>
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar Preview" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', background: avatarBg }} />
                            ) : (
                                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: avatarBg || 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', border: '3px dashed var(--primary)' }}>👤</div>
                            )}

                            <label className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'center' }}>
                                {uploading ? 'กำลังโหลด...' : '📸 อัปโหลดรูป'}
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
                            </label>

                            {avatarUrl && (
                                <button type="button" onClick={() => setAvatarUrl('')} style={{ fontSize: '0.85rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                                    ลบรูปโปรไฟล์
                                </button>
                            )}
                        </div>

                        <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-muted)' }}>สีพื้นหลังรูปโปรไฟล์ (เมื่อใช้ Emoji หรือไฟล์โปร่งใส)</label>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <input type="color" value={avatarBg} onChange={e => setAvatarBg(e.target.value)} style={{ width: '36px', height: '36px', padding: 0, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }} />
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{avatarBg}</span>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-muted)' }}>หรือเลือกอีโมจิน่ารักๆ แทนรูปภาพ 👇</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxHeight: '120px', overflowY: 'auto', padding: '8px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid #eee' }}>
                                    {EMOJI_LIST.map(em => (
                                        <button key={em} type="button" onClick={() => setEmojiAsAvatar(em)} style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '8px', transition: 'background 0.2s' }} className="hover-bg">
                                            {em}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '4px 0' }} />

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Display Name (ชื่อที่แสดงผล)</label>
                            <input
                                type="text" className="input-field" placeholder="ตั้งชื่อเล่นน่ารักๆ..."
                                value={displayName} onChange={e => setDisplayName(e.target.value)}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Username (ใช้สำหรับล็อกอิน)</label>
                            <input
                                type="text" className="input-field" placeholder="username" required minLength={3}
                                value={username} onChange={e => setUsername(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-muted)' }}>เลือกสีธีมที่ชอบ 🎨</label>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <input
                                type="color"
                                value={themeColor}
                                onChange={e => setThemeColor(e.target.value)}
                                style={{ width: '50px', height: '50px', padding: 0, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: themeColor }}>{themeColor}</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'gray', marginTop: '8px' }}>สีนี้จะนำไปผสมและใช้ตกแต่งปุ่ม/พื้นหลังทั่วทั้งเว็บเลยค่ะ!</p>
                    </div>

                    <button type="submit" className="btn-primary" disabled={saving} style={{ alignSelf: 'flex-start', width: 'auto' }}>
                        {saving ? 'กำลังบันทึก...' : '💾 บันทึกการตั้งค่า'}
                    </button>
                </form>
            </div>

            <div className="card" style={{ maxWidth: '600px' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--primary-dark)' }}>🔒 เปลี่ยนรหัสผ่าน</h2>
                <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-muted)' }}>รหัสผ่านเดิม</label>
                        <input
                            type="password" required className="input-field"
                            value={oldPassword} onChange={e => setOldPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-muted)' }}>รหัสผ่านใหม่</label>
                        <input
                            type="password" required className="input-field" minLength={6}
                            value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="btn-secondary" disabled={passSaving} style={{ alignSelf: 'flex-start', width: 'auto' }}>
                        {passSaving ? 'กำลังเปลี่ยน...' : 'อัปเดตรหัสผ่าน'}
                    </button>
                </form>
            </div>
        </div>
    );
}
