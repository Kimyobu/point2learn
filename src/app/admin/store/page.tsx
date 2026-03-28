'use client';
import { apiFetch } from '@/lib/apiClient';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { siteConfig } from '@/config/site';

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { ease: [0.25, 1, 0.5, 1] as const, duration: 0.4 } }
};

type Reward = { id: string; name: string; description: string; pointsCost: number; isAvailable: boolean; imageUrl: string; cooldownMin: number };

export default function StoreManagerPage() {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [newReward, setNewReward] = useState({ name: '', description: '', pointsCost: 100, imageUrl: '', cooldownMin: 0 });

    useEffect(() => {
        fetchRewards();
    }, []);

    const fetchRewards = async () => {
        const res = await apiFetch('/api/rewards');
        if (res.ok) setRewards(await res.json());
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', file);

        const res = await apiFetch('/api/upload', { method: 'POST', body: uploadData });
        const data = await res.json();

        if (res.ok) {
            setNewReward(prev => ({ ...prev, imageUrl: data.url }));
        } else {
            alert('อัปโหลดรูปไม่สำเร็จค่ะ');
        }
        setUploading(false);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`ต้องการลบ ${name} ${siteConfig.adminStore.confirmDeleteSuffix}`)) return;

        const res = await apiFetch(`/api/rewards/${id}`, { method: 'DELETE' });
        if (res.ok) {
            alert(siteConfig.adminStore.alertDeleteSuccess);
            await fetchRewards();
        }
    };

    const handleCreateReward = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const res = await apiFetch('/api/rewards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newReward)
        });

        if (res.ok) {
            alert(siteConfig.adminStore.alertCreateSuccess);
            setNewReward({ name: '', description: '', pointsCost: 100, imageUrl: '', cooldownMin: 0 });
            await fetchRewards();
        } else {
            alert(siteConfig.adminStore.alertError);
        }
        setLoading(false);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }} style={{ textAlign: 'left', marginTop: 'var(--space-4)' }}>
                <h1 className="title" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1 }}>
                    🎁 {siteConfig.adminStore.headline}
                </h1>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} className="card" style={{ background: 'var(--surface)', border: '1px solid rgba(58, 16, 30, 0.1)', padding: 'var(--space-6)' }}>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', color: 'var(--text-main)', fontWeight: 700 }}>
                    ✨ {siteConfig.adminStore.addRewardHeader}
                </h2>
                <form onSubmit={handleCreateReward} style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                            {newReward.imageUrl ? (
                                <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                                    <Image src={newReward.imageUrl} alt="preview" fill sizes="80px" style={{ objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid #ccc' }} />
                                </div>
                            ) : (
                                <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', background: 'var(--secondary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎁</div>
                            )}
                            <label className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>
                                {uploading ? '...' : '📸 อัพรูป'}
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
                            </label>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.95rem' }}>{siteConfig.adminStore.formNameLabel}</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder={siteConfig.adminStore.formNamePlaceholder}
                                value={newReward.name}
                                onChange={e => setNewReward({ ...newReward, name: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.95rem' }}>{siteConfig.adminStore.formDescLabel}</label>
                        <textarea
                            className="input-field"
                            placeholder={siteConfig.adminStore.formDescPlaceholder}
                            value={newReward.description}
                            onChange={e => setNewReward({ ...newReward, description: e.target.value })}
                            rows={2}
                            style={{ resize: 'vertical' }}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.95rem' }}>{siteConfig.adminStore.formPointsLabel}</label>
                            <input
                                type="number"
                                className="input-field"
                                min="1"
                                value={newReward.pointsCost}
                                onChange={e => setNewReward({ ...newReward, pointsCost: parseInt(e.target.value) || 0 })}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.95rem' }}>{siteConfig.adminStore.formCooldownLabel}</label>
                            <input
                                type="number"
                                className="input-field"
                                min="0"
                                value={newReward.cooldownMin}
                                onChange={e => setNewReward({ ...newReward, cooldownMin: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
                        {loading ? 'กำลังเพิ่ม...' : `➕ ${siteConfig.adminStore.btnAddReward}`}
                    </button>
                </form>
            </motion.div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(58, 16, 30, 0.1)' }} />

            <div>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', color: 'var(--text-main)', opacity: 0.9, fontWeight: 700 }}>
                    {siteConfig.adminStore.storeItemsHeader} ({rewards.length})
                </h2>
                {rewards.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed rgba(58,16,30,0.1)' }}>
                        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px', opacity: 0.5 }}>🍃</span>
                        {siteConfig.adminStore.emptyStore}
                    </div>
                ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                        {rewards.map(reward => (
                            <motion.div variants={itemVariants} whileHover={{ y: -2 }} key={reward.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                {reward.imageUrl ? (
                                    <div style={{ position: 'relative', width: '100%', height: '150px', marginBottom: '16px' }}>
                                        <Image src={reward.imageUrl} alt={reward.name} fill sizes="(max-width: 768px) 100vw, 300px" style={{ objectFit: 'cover', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }} />
                                    </div>
                                ) : (
                                    <div style={{ width: '100%', height: '150px', background: 'var(--secondary-light)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', marginBottom: '16px' }}>
                                        🎁
                                    </div>
                                )}
                                <h3 style={{ fontWeight: 600, fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '4px' }}>{reward.name}</h3>
                                {reward.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>{reward.description}</p>}

                                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(58, 16, 30, 0.05)' }}>
                                    <span className="badge badge-points" style={{ padding: '4px 12px' }}>{reward.pointsCost} {siteConfig.global.pointsSuffix}</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => handleDelete(reward.id, reward.name)}>{siteConfig.adminStore.btnDelete}</span>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
