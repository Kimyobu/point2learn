'use client';
import { apiFetch } from '@/lib/apiClient';
import { useEffect, useState } from 'react';
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
        if (!confirm(status === 'APPROVED' ? siteConfig.adminDashboard.confirmApprove : siteConfig.adminDashboard.confirmReject)) return;

        setLoading(id);
        const res = await apiFetch(`/api/submissions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });

        if (res.ok) {
            alert(status === 'APPROVED' ? siteConfig.adminDashboard.alertApproveSuccess : siteConfig.adminDashboard.alertRejectSuccess);
            await fetchSubmissions();
        } else {
            alert(siteConfig.adminDashboard.alertError);
        }
        setLoading(null);
    };

    const pendingSubmissions = submissions.filter(s => s.status === 'PENDING');
    const pastSubmissions = submissions.filter(s => s.status !== 'PENDING');

    const renderCard = (sub: Submission) => (
        <motion.div variants={itemVariants} whileHover={{ y: -2 }} key={sub.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--surface)', borderLeft: sub.status === 'PENDING' ? '4px solid var(--primary)' : '1px solid rgba(58, 16, 30, 0.1)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{sub.task.title}</h3>
                        <div className="badge badge-points" style={{ fontSize: '0.85rem' }}>+{sub.task.points} {siteConfig.global.pointsSuffix}</div>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{siteConfig.adminDashboard.submittedByPrefix} <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{sub.user.username}</span></p>
                    <p style={{ fontSize: '0.85rem', color: '#888' }}>{new Date(sub.createdAt).toLocaleString()}</p>
                </div>
            </div>

            {sub.imageUrl && (
                <motion.a whileHover={{ scale: 1.02 }} href={sub.imageUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', contain: 'content', width: '100%' }}>
                    {sub.imageUrl.toLowerCase().endsWith('.pdf') ? (
                        <iframe src={sub.imageUrl} style={{ width: '100%', height: '200px', border: '1px solid rgba(58,16,30,0.1)', borderRadius: 'var(--radius-sm)' }} title="PDF Preview" />
                    ) : (
                        <div style={{ position: 'relative', width: '100%', height: '250px' }}>
                            <Image src={sub.imageUrl} alt="Proof" fill sizes="(max-width: 768px) 100vw, 400px" style={{ objectFit: 'contain', borderRadius: 'var(--radius-md)', background: 'var(--secondary-light)' }} />
                        </div>
                    )}
                </motion.a>
            )}

            {sub.status === 'PENDING' ? (
                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(58, 16, 30, 0.05)' }}>
                    <button
                        className="btn-primary"
                        style={{ flex: 1, padding: '12px' }}
                        onClick={() => handleAction(sub.id, 'APPROVED')}
                        disabled={loading === sub.id}
                    >
                        ✅ {siteConfig.adminDashboard.btnApprove} ({sub.task.points} {siteConfig.global.pointsSuffix})
                    </button>
                    <button
                        className="btn-secondary"
                        style={{ flex: 1, padding: '12px', color: 'var(--danger)', borderColor: 'var(--danger)', background: 'transparent' }}
                        onClick={() => handleAction(sub.id, 'REJECTED')}
                        disabled={loading === sub.id}
                    >
                        ❌ {siteConfig.adminDashboard.btnReject}
                    </button>
                </div>
            ) : (
                <div style={{ marginTop: 'auto', fontWeight: 600, paddingTop: '16px', borderTop: '1px solid rgba(58, 16, 30, 0.05)' }}>
                    {sub.status === 'APPROVED' ? <span style={{ color: 'var(--success)' }}>✅ {siteConfig.adminDashboard.statusApproved}</span> : <span style={{ color: 'var(--danger)' }}>❌ {siteConfig.adminDashboard.statusRejected}</span>}
                </div>
            )}
        </motion.div>
    );

    return (
        <motion.div className="animate-fade-in" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }} style={{ textAlign: 'left', marginTop: 'var(--space-4)' }}>
                <h1 className="title" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1 }}>
                    ✉️ {siteConfig.adminDashboard.headline}
                </h1>
            </motion.div>

            <div>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', color: 'var(--text-main)', opacity: 0.9, fontWeight: 700 }}>
                    {siteConfig.adminDashboard.pendingReview} ({pendingSubmissions.length})
                </h2>
                {pendingSubmissions.length === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed rgba(58,16,30,0.1)' }}>
                        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px', opacity: 0.5 }}>🍃</span>
                        {siteConfig.adminDashboard.emptyPending}
                    </motion.div>
                ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                        {pendingSubmissions.map(renderCard)}
                    </motion.div>
                )}
            </div>

            {pastSubmissions.length > 0 && (
                <div style={{ marginTop: '32px' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-muted)' }}>
                        {siteConfig.adminDashboard.reviewHistory}
                    </h2>
                    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', opacity: 0.7 }}>
                        {pastSubmissions.map(renderCard)}
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
