'use client';

import { useEffect, useState } from 'react';

type Submission = {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    updatedAt: string;
    imageUrl: string | null;
    task: { title: string; points: number; type: string };
};

const STATUS_LABELS = {
    PENDING: { label: '⏳ รอตรวจ', color: '#ffb703' },
    APPROVED: { label: '✅ อนุมัติ', color: 'var(--success)' },
    REJECTED: { label: '❌ ปฏิเสธ', color: 'var(--danger)' },
};

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function PlayerHistoryPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/submissions')
            .then(r => r.json())
            .then(data => {
                setSubmissions(data);
                setLoading(false);
            });
    }, []);

    const filtered = submissions.filter(s => filterStatus === 'ALL' || s.status === filterStatus);

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <h1 className="title" style={{ fontSize: '1.8rem', margin: 0 }}>📖 ประวัติการส่งงาน</h1>
                <select
                    className="input-field"
                    style={{ width: 'auto', padding: '8px 12px', minWidth: '140px' }}
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                >
                    <option value="ALL">ทั้งหมด</option>
                    <option value="PENDING">รอตรวจ ⏳</option>
                    <option value="APPROVED">อนุมัติแล้ว ✅</option>
                    <option value="REJECTED">ถูกปฏิเสธ ❌</option>
                </select>
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลด...</p>
            ) : filtered.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
                    <p>ยังไม่มีประวัติการส่งงาน</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filtered.map(sub => {
                        const statusInfo = STATUS_LABELS[sub.status];
                        return (
                            <div key={sub.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                                    <div>
                                        <h3 style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>{sub.task.title}</h3>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                                            ส่งเมื่อ: {formatDate(sub.createdAt)}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span className="badge badge-points">+{sub.task.points} pt</span>
                                        <span style={{
                                            fontSize: '0.85rem', fontWeight: 600,
                                            color: statusInfo.color,
                                            background: `${statusInfo.color}18`,
                                            padding: '4px 10px', borderRadius: '20px',
                                            border: `1px solid ${statusInfo.color}44`
                                        }}>
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                </div>

                                {sub.status !== 'PENDING' && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                                        {sub.status === 'APPROVED' ? '✨ ตรวจแล้ว' : '🔄 ตรวจแล้ว'} เมื่อ: {formatDate(sub.updatedAt)}
                                    </p>
                                )}

                                {sub.imageUrl && (
                                    <a href={sub.imageUrl} target="_blank" rel="noopener noreferrer"
                                        style={{ fontSize: '0.8rem', color: 'var(--primary-dark)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        📎 ดูไฟล์แนบ
                                    </a>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
