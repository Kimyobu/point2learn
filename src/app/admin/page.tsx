'use client';
import { apiFetch } from '@/lib/apiClient';

import { useEffect, useState } from 'react';

type Submission = {
    id: string; status: string; imageUrl: string | null; createdAt: string;
    task: { title: string; points: number; type: string };
    user: { username: string; points: number };
};

export default function SubmissionReviewPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        const res = await apiFetch('/api/submissions');
        if (res.ok) setSubmissions(await res.json());
    };

    const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        if (!confirm(`คุณแน่ใจว่าต้องการ ${status === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ'} งานนี้?`)) return;

        setLoading(id);
        const res = await apiFetch(`/api/submissions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });

        if (res.ok) {
            alert(status === 'APPROVED' ? 'อนุมัติสำเร็จ 💖 ให้พอยท์แล้ว!' : 'ปฏิเสธงานแล้ว');
            await fetchSubmissions();
        } else {
            alert('เกิดข้อผิดพลาดในการทำรายการ');
        }
        setLoading(null);
    };

    const pendingSubmissions = submissions.filter(s => s.status === 'PENDING');
    const pastSubmissions = submissions.filter(s => s.status !== 'PENDING');

    const renderCard = (sub: Submission) => (
        <div key={sub.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{sub.task.title}</h3>
                    <p style={{ color: 'var(--text-muted)' }}>ส่งโดย: {sub.user.username}</p>
                    <p style={{ fontSize: '0.85rem', color: '#888' }}>{new Date(sub.createdAt).toLocaleString()}</p>
                </div>
                <div className="badge badge-points">+{sub.task.points} pt</div>
            </div>

            {sub.imageUrl && (
                <a href={sub.imageUrl} target="_blank" rel="noopener noreferrer">
                    {sub.imageUrl.toLowerCase().endsWith('.pdf') ? (
                        <iframe src={sub.imageUrl} style={{ width: '100%', height: '200px', border: '1px solid #eee', borderRadius: 'var(--radius-sm)' }} title="PDF Preview" />
                    ) : (
                        <img src={sub.imageUrl} alt="Proof" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '16px' }} loading="lazy" />
                    )}
                </a>
            )}

            {sub.status === 'PENDING' ? (
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button
                        className="btn-primary"
                        style={{ flex: 1, padding: '10px' }}
                        onClick={() => handleAction(sub.id, 'APPROVED')}
                        disabled={loading === sub.id}
                    >
                        ✅ อนุมัติ ({sub.task.points}pt)
                    </button>
                    <button
                        className="btn-secondary"
                        style={{ flex: 1, padding: '10px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                        onClick={() => handleAction(sub.id, 'REJECTED')}
                        disabled={loading === sub.id}
                    >
                        ❌ ปฏิเสธ
                    </button>
                </div>
            ) : (
                <div style={{ marginTop: 'auto', fontWeight: 600 }}>
                    {sub.status === 'APPROVED' ? <span style={{ color: 'var(--success)' }}>✅ อนุมัติแล้ว</span> : <span style={{ color: 'var(--danger)' }}>❌ ปฏิเสธแล้ว</span>}
                </div>
            )}
        </div>
    );

    return (
        <div className="animate-fade-in">
            <h1 className="title" style={{ fontSize: '2rem', marginBottom: '24px' }}>✉️ ตรวจผลงาน</h1>

            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--primary-dark)' }}>รอตรวจ ({pendingSubmissions.length})</h2>
            {pendingSubmissions.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>ยังไม่มีผลงานใหม่ให้ตรวจครับ</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    {pendingSubmissions.map(renderCard)}
                </div>
            )}

            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-muted)' }}>ประวัติการตรวจ</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', opacity: 0.8 }}>
                {pastSubmissions.map(renderCard)}
            </div>
        </div>
    );
}
