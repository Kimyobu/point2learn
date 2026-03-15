'use client';

import { useEffect, useState } from 'react';

type Reward = { id: string; name: string; description: string; pointsCost: number; isAvailable: boolean; imageUrl: string };

export default function StoreManagerPage() {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [pointsCost, setPointsCost] = useState(50);
    const [imageUrl, setImageUrl] = useState('');

    useEffect(() => {
        fetchRewards();
    }, []);

    const fetchRewards = async () => {
        const res = await fetch('/api/rewards');
        if (res.ok) setRewards(await res.json());
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', file);

        const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
        const data = await res.json();

        if (res.ok) {
            setImageUrl(data.url);
        } else {
            alert('อัปโหลดรูปไม่สำเร็จค่ะ');
        }
        setUploading(false);
    };

    const handleCreateReward = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const res = await fetch('/api/rewards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, pointsCost, imageUrl })
        });

        if (res.ok) {
            alert('เพิ่มของรางวัลสำเร็จ!');
            setName('');
            setDescription('');
            setPointsCost(50);
            setImageUrl('');
            await fetchRewards();
        } else {
            alert('เกิดข้อผิดพลาดในการเพิ่มของรางวัล');
        }
        setLoading(false);
    };

    return (
        <div className="animate-fade-in">
            <h1 className="title" style={{ fontSize: '2rem', marginBottom: '24px' }}>🎁 จัดการร้านค้า</h1>

            <div className="card" style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--primary-dark)' }}>+ เพิ่มของรางวัลใหม่</h2>
                <form onSubmit={handleCreateReward} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                            {imageUrl ? (
                                <img src={imageUrl} alt="preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid #ccc' }} />
                            ) : (
                                <div style={{ width: '100px', height: '100px', borderRadius: 'var(--radius-sm)', background: 'var(--secondary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎁</div>
                            )}

                            <label className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'center' }}>
                                {uploading ? 'กำลังโหลด...' : '📸 อัพรูป'}
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
                            </label>
                            {imageUrl && (
                                <button type="button" onClick={() => setImageUrl('')} style={{ fontSize: '0.8rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                                    ลบรูปภาพ
                                </button>
                            )}
                        </div>

                        <div style={{ flex: 1, minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-muted)' }}>ชื่อไอเทม/รางวัล (ถ้ามีคำว่า "สุ่ม" หรือ "กล่อง" จะมีแอนิเมชันตอนกด)</label>
                                <input
                                    className="input-field" placeholder="ตัวอย่าง: กระเป๋าชาแนล / กล่องสุ่มใจดี" required
                                    value={name} onChange={e => setName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-muted)' }}>รายละเอียดเพิ่มเติม (ไม่บังคับ)</label>
                                <input
                                    className="input-field" placeholder="ข้อจำกัดหรือเงื่อนไข..."
                                    value={description} onChange={e => setDescription(e.target.value)}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-muted)' }}>ราคาพอยท์ ที่ต้องใช้แลก</label>
                                <input
                                    type="number" className="input-field" required min="1"
                                    value={pointsCost} onChange={e => setPointsCost(parseInt(e.target.value) || 1)}
                                />
                            </div>
                        </div>

                    </div>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ alignSelf: 'flex-start', width: 'auto' }}>
                        {loading ? 'กำลังเพิ่ม...' : 'เพิ่มไอเทมเข้าร้าน'}
                    </button>
                </form>
            </div>

            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-muted)' }}>ไอเทมในร้าน ({rewards.length})</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {rewards.map(reward => (
                    <div key={reward.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {reward.imageUrl ? (
                            <img src={reward.imageUrl} alt={reward.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 'var(--radius-md) var(--radius-md) 0 0', marginBottom: '16px' }} />
                        ) : (
                            <div style={{ width: '100%', height: '150px', background: 'var(--secondary-light)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', marginBottom: '16px' }}>
                                🎁
                            </div>
                        )}
                        <h3 style={{ fontWeight: 600, fontSize: '1.2rem', color: 'var(--primary-dark)' }}>{reward.name}</h3>
                        {reward.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>{reward.description}</p>}

                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="badge badge-points">{reward.pointsCost} pt</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>เปิดขายอยู่</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
