'use client';
import { apiFetch } from '@/lib/apiClient';

import { useEffect, useState } from 'react';

type Submission = {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    updatedAt: string;
    imageUrl: string | null;
    task: { title: string; points: number; type: string };
};

type RedeemLog = {
    id: string;
    rewardName: string;
    pointsSpent: number;
    isGacha: boolean;
    createdAt: string;
};

export default function PlayerHistoryPage() {
    const [tab, setTab] = useState<'submissions' | 'redeems'>('submissions');
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [redeemLogs, setRedeemLogs] = useState<RedeemLog[]>([]);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            apiFetch('/api/submissions').then(r => r.json()),
            apiFetch('/api/redeem-logs').then(r => r.json()),
        ]).then(([subs, logs]) => {
            setSubmissions(subs);
            setRedeemLogs(logs);
            setLoading(false);
        });
    }, []);

    const filtered = submissions.filter(s => filterStatus === 'ALL' || s.status === filterStatus);

    const tabStyle = (active: boolean) => ({
        padding: '10px 20px',
        fontWeight: 600 as const,
        fontSize: '1rem',
        borderRadius: 'var(--radius-sm)',
        background: active ? 'var(--primary)' : 'transparent',
        color: active ? 'white' : 'var(--text-main)',
        cursor: 'pointer' as const,
        border: active ? 'none' : '2px solid var(--primary-light)',
    });

    return (
        <div className="animate-fade-in">
            <h1 className="title" style={{ fontSize: '2rem', marginBottom: '24px' }}>📖 ประวัติ</h1>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <button style={tabStyle(tab === 'submissions')} onClick={() => setTab('submissions')}>📝 การส่งงาน</button>
                <button style={tabStyle(tab === 'redeems')} onClick={() => setTab('redeems')}>🎁 การแลกรางวัล</button>
            </div>

            {tab === 'submissions' && (
                <>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        {[
                            { label: 'รอตรวจ', value: submissions.filter(s => s.status === 'PENDING').length, color: '#ffb703' },
                            { label: 'อนุมัติแล้ว', value: submissions.filter(s => s.status === 'APPROVED').length, color: 'var(--success)' },
                            { label: 'ปฏิเสธ', value: submissions.filter(s => s.status === 'REJECTED').length, color: 'var(--danger)' },
                        ].map(stat => (
                            <div key={stat.label} className="card" style={{ flex: 1, minWidth: '80px', textAlign: 'center', padding: '12px', borderTop: `3px solid ${stat.color}` }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <select className="input-field" style={{ width: 'auto', padding: '8px 12px', minWidth: '140px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                            <option value="ALL">ทั้งหมด ({submissions.length})</option>
                            <option value="PENDING">รอตรวจ ⏳</option>
                            <option value="APPROVED">อนุมัติแล้ว ✅</option>
                            <option value="REJECTED">ถูกปฏิเสธ ❌</option>
                        </select>
                    </div>

                    {loading ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>กำลังโหลด...</p>
                    ) : filtered.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
                            <p style={{ color: 'var(--text-muted)' }}>ยังไม่มีประวัติการส่งงาน</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                            {filtered.map(sub => (
                                <div key={sub.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{sub.task.title}</h3>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(sub.createdAt).toLocaleString('th-TH')}</p>
                                        </div>
                                        <div className="badge badge-points">+{sub.task.points} pt</div>
                                    </div>
                                    {sub.imageUrl && (
                                        <a href={sub.imageUrl} target="_blank" rel="noopener noreferrer">
                                            {sub.imageUrl.toLowerCase().endsWith('.pdf') ? (
                                                <iframe src={sub.imageUrl} style={{ width: '100%', height: '180px', border: '1px solid #eee', borderRadius: 'var(--radius-sm)', pointerEvents: 'none' }} title="PDF Preview" />
                                            ) : (
                                                <img src={sub.imageUrl} alt="หลักฐาน" loading="lazy" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: 'var(--radius-md)', background: 'var(--background)' }} />
                                            )}
                                        </a>
                                    )}
                                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{sub.task.type}</span>
                                        <span style={{ fontWeight: 600, color: sub.status === 'APPROVED' ? 'var(--success)' : sub.status === 'REJECTED' ? 'var(--danger)' : '#ffb703' }}>
                                            {sub.status === 'PENDING' ? '⏳ รอตรวจ' : sub.status === 'APPROVED' ? '✅ อนุมัติแล้ว' : '❌ ปฏิเสธ'}
                                        </span>
                                    </div>
                                    {sub.status !== 'PENDING' && (
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>ตรวจเมื่อ: {new Date(sub.updatedAt).toLocaleString('th-TH')}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {tab === 'redeems' && (
                <>
                    {loading ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>กำลังโหลด...</p>
                    ) : redeemLogs.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎁</div>
                            <p style={{ color: 'var(--text-muted)' }}>ยังไม่มีประวัติการแลกรางวัล</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {redeemLogs.map(log => (
                                <div key={log.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                                            {log.isGacha ? '🎲' : '🎁'} {log.rewardName}
                                        </h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleString('th-TH')}</p>
                                    </div>
                                    <div>
                                        <span className="badge" style={{ background: 'var(--danger)', color: 'white' }}>-{log.pointsSpent} pt</span>
                                        {log.isGacha && <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>กาชา</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
