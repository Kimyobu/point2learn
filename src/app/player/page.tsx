'use client';
import { apiFetch } from '@/lib/apiClient';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { usePlayerUser } from '@/context/PlayerUser';
import { siteConfig } from '@/config/site';

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { ease: [0.25, 1, 0.5, 1] as const, duration: 0.4 } }
};

type Task = { id: string; title: string; description: string; points: number; type: string };
type Submission = { id: string; taskId: string; status: string; imageUrl: string | null; createdAt: string };
type TaskType = { id: string; name: string; resetMode: string };

export default function PlayerDashboard() {
    const { user } = usePlayerUser();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [uploading, setUploading] = useState<string | null>(null);
    const [sortOption, setSortOption] = useState('NEWEST');
    const [seenApproved, setSeenApproved] = useState(false);

    useEffect(() => {
        // Check if user already saw approved quests in this session
        const hasSeen = sessionStorage.getItem('seenApproved');
        if (hasSeen === 'true') {
            setSeenApproved(true);
        } else {
            // First visit in this session: mark as seen for next time
            sessionStorage.setItem('seenApproved', 'true');
        }
        fetchData();
    }, []);

    const fetchData = async () => {
        const [tasksRes, subRes, msgRes, typesRes] = await Promise.all([
            apiFetch('/api/tasks'),
            apiFetch('/api/submissions'),
            apiFetch('/api/messages'),
            apiFetch('/api/task-types'),
        ]);
        if (tasksRes.ok) setTasks(await tasksRes.json());
        if (subRes.ok) setSubmissions(await subRes.json());
        if (msgRes.ok) setMessages(await msgRes.json());
        if (typesRes.ok) setTaskTypes(await typesRes.json());
    };

    const handleFileUpload = async (taskId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(taskId);
        const formData = new FormData();
        formData.append('taskId', taskId);
        formData.append('image', file);

        const res = await apiFetch('/api/submissions', { method: 'POST', body: formData });
        if (res.ok) {
            alert(siteConfig.playerDashboard.alertSubmitSuccess);
            await fetchData();
        } else {
            alert(siteConfig.playerDashboard.alertSubmitFailed);
        }
        setUploading(null);
    };

    // Check if a task can be submitted based on reset mode
    const canSubmitTask = (task: Task) => {
        const taskType = taskTypes.find(t => t.name === task.type);
        const resetMode = taskType?.resetMode || 'NONE';
        const taskSubs = submissions.filter(s => s.taskId === task.id);

        if (taskSubs.length === 0) return { canSubmit: true, status: null, count: 0 };

        const latestSub = taskSubs[0]; // sorted by createdAt desc from API

        // If latest is PENDING, always block
        if (latestSub.status === 'PENDING') return { canSubmit: false, status: 'PENDING', count: taskSubs.length };

        // NONE mode: one-time task
        if (resetMode === 'NONE') {
            if (latestSub.status === 'APPROVED') return { canSubmit: false, status: 'APPROVED', count: taskSubs.length };
            if (latestSub.status === 'REJECTED') return { canSubmit: true, status: 'REJECTED', count: taskSubs.length };
        }

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // DAILY: reset every day at 00:00
        if (resetMode === 'DAILY') {
            const todaySubs = taskSubs.filter(s => new Date(s.createdAt) >= startOfToday);
            if (todaySubs.length === 0) return { canSubmit: true, status: null, count: taskSubs.length };
            const todayLatest = todaySubs[0];
            return { canSubmit: todayLatest.status === 'REJECTED', status: todayLatest.status, count: taskSubs.length };
        }

        // EVERY_N_DAYS:N
        if (resetMode.startsWith('EVERY_N_DAYS:')) {
            const n = parseInt(resetMode.split(':')[1]) || 1;
            const windowStart = new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
            const windowSubs = taskSubs.filter(s => new Date(s.createdAt) >= windowStart);
            if (windowSubs.length === 0) return { canSubmit: true, status: null, count: taskSubs.length };
            const wLatest = windowSubs[0];
            return { canSubmit: wLatest.status === 'REJECTED', status: wLatest.status, count: taskSubs.length };
        }

        // N_PER_WEEK:N (N submissions per 7 days)
        if (resetMode.startsWith('N_PER_WEEK:')) {
            const maxPerWeek = parseInt(resetMode.split(':')[1]) || 1;
            const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const weekSubs = taskSubs.filter(s => new Date(s.createdAt) >= weekStart && s.status !== 'REJECTED');
            if (weekSubs.length < maxPerWeek) return { canSubmit: true, status: null, count: taskSubs.length };
            return { canSubmit: false, status: 'COOLDOWN', count: taskSubs.length };
        }

        // N_PER_M_DAYS:N:M (N submissions per M days)
        if (resetMode.startsWith('N_PER_M_DAYS:')) {
            const parts = resetMode.split(':');
            const maxN = parseInt(parts[1]) || 1;
            const mDays = parseInt(parts[2]) || 7;
            const windowStart = new Date(now.getTime() - mDays * 24 * 60 * 60 * 1000);
            const windowSubs = taskSubs.filter(s => new Date(s.createdAt) >= windowStart && s.status !== 'REJECTED');
            if (windowSubs.length < maxN) return { canSubmit: true, status: null, count: taskSubs.length };
            return { canSubmit: false, status: 'COOLDOWN', count: taskSubs.length };
        }

        // Fallback: use latest status
        return { canSubmit: latestSub.status === 'REJECTED', status: latestSub.status, count: taskSubs.length };
    };

    const getTaskSubmission = (taskId: string) => {
        return submissions.find(s => s.taskId === taskId) || null;
    };

    const getLevelInfo = (totalPoints: number) => {
        if (totalPoints < 50) return { title: 'ผู้เริ่มต้น 🌱', min: 0, max: 50, level: 0 };
        if (totalPoints < 150) return { title: 'เด็กดี 👧', min: 50, max: 150, level: 1 };
        if (totalPoints < 300) return { title: 'คนเก่งของเค้า 💖', min: 150, max: 300, level: 2 };
        if (totalPoints < 500) return { title: 'ที่รัก 💕', min: 300, max: 500, level: 3 };
        if (totalPoints < 1000) return { title: 'เจ้าหญิงของเค้า 👑', min: 500, max: 1000, level: 4 };
        return { title: 'สุดยอดนางฟ้า 👼', min: 1000, max: 1000, level: 5 };
    };

    const sortedTasks = (() => {
        let result = [...tasks];
        if (sortOption === 'NEWEST') result.reverse();
        if (sortOption === 'POINTS_DESC') result.sort((a, b) => b.points - a.points);
        if (sortOption === 'POINTS_ASC') result.sort((a, b) => a.points - b.points);
        return result;
    })();

    // Count approved quests that are hidden (NONE mode only)
    const approvedCount = sortedTasks.filter(t => {
        const info = canSubmitTask(t);
        return info.status === 'APPROVED' && !info.canSubmit;
    }).length;

    // Filter out APPROVED tasks (NONE mode) if user already saw them
    const visibleTasks = seenApproved
        ? sortedTasks.filter(t => {
            const info = canSubmitTask(t);
            return !(info.status === 'APPROVED' && !info.canSubmit);
        })
        : sortedTasks;

    const tasksByType = visibleTasks.reduce((acc, task) => {
        if (!acc[task.type]) acc[task.type] = [];
        acc[task.type].push(task);
        return acc;
    }, {} as Record<string, Task[]>);

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            
            {/* Header Section without Card Container */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} style={{ textAlign: 'left', marginTop: 'var(--space-4)' }}>
                <h1 className="title" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '8px', lineHeight: 1.1 }}>
                    {siteConfig.playerDashboard.welcomePrefix} ✨
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
                    {siteConfig.playerDashboard.welcomeSuffix}
                </p>
            </motion.div>

            {messages.length > 0 && (
                <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {messages.map(msg => (
                        <motion.div variants={itemVariants} key={msg.id} style={{ 
                            background: 'var(--surface)', 
                            borderLeft: '4px solid var(--primary-dark)',
                            color: 'var(--text-main)', 
                            padding: '16px 20px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '16px',
                            boxShadow: 'var(--shadow-sm)',
                            borderRadius: '0 var(--radius-md) var(--radius-md) 0'
                        }}>
                            <span style={{ fontSize: '1.5rem', opacity: 0.8 }}>💌</span>
                            <p style={{ margin: 0, fontWeight: 500, lineHeight: 1.5, fontSize: '1.05rem' }}>{msg.content}</p>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Profile Section without heavy card wrapping */}
            {user && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {user.avatarUrl ? (
                            <Image src={user.avatarUrl} alt="Avatar" width={64} height={64} style={{ borderRadius: '50%', background: user.avatarBg || 'transparent', objectFit: 'cover', boxShadow: 'var(--shadow-sm)' }} priority />
                        ) : (
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: user.avatarBg || 'var(--primary-light)', color: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', boxShadow: 'var(--shadow-sm)' }}>👤</div>
                        )}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>{siteConfig.playerDashboard.titlePrefix}</span>
                                <h2 style={{ fontSize: '1.6rem', color: 'var(--text-main)', margin: 0, fontWeight: 800 }}>
                                    {user.title || getLevelInfo(user.totalPointsEarned).title}
                                </h2>
                                <span style={{ fontSize: '0.85rem', background: 'var(--surface)', border: '1px solid var(--primary-light)', color: 'var(--primary-dark)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontWeight: 700, marginLeft: 'auto' }}>
                                    {siteConfig.playerDashboard.levelPrefix} {getLevelInfo(user.totalPointsEarned).level}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            <span>{siteConfig.playerDashboard.accumulatedPoints}</span>
                            <span>{user.totalPointsEarned} / {getLevelInfo(user.totalPointsEarned).max} {siteConfig.global.pointsSuffix}</span>
                        </div>
                        <div style={{ width: '100%', background: 'rgba(58, 16, 30, 0.05)', borderRadius: 'var(--radius-full)', height: '14px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${Math.min(100, (user.totalPointsEarned - getLevelInfo(user.totalPointsEarned).min) / (getLevelInfo(user.totalPointsEarned).max - getLevelInfo(user.totalPointsEarned).min) * 100)}%`,
                                height: '100%',
                                background: 'var(--text-main)',
                                transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                                borderRadius: 'var(--radius-full)'
                            }} />
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Banner for hidden approved quests */}
            {seenApproved && approvedCount > 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }} style={{ 
                    background: 'var(--success)', 
                    color: '#ffffff', 
                    padding: '16px 24px', 
                    borderRadius: 'var(--radius-md)',
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    flexWrap: 'wrap', 
                    gap: '12px',
                    boxShadow: '0 4px 12px rgba(112, 169, 143, 0.3)'
                }}>
                    <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>✨ {siteConfig.playerDashboard.approvedCountPrefix} {approvedCount} {siteConfig.playerDashboard.approvedCountSuffix}</span>
                    <Link href="/player/history" style={{ color: '#ffffff', fontWeight: 700, textDecoration: 'underline', opacity: 0.9 }}>{siteConfig.playerDashboard.historyLink}</Link>
                </motion.div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <select
                    className="input-field"
                    style={{ width: 'auto', padding: '10px 16px', minWidth: '180px', fontWeight: 500, borderRadius: 'var(--radius-full)' }}
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                >
                    <option value="NEWEST">{siteConfig.playerDashboard.sortNewest}</option>
                    <option value="OLDEST">{siteConfig.playerDashboard.sortOldest}</option>
                    <option value="POINTS_DESC">{siteConfig.playerDashboard.sortPointsDesc}</option>
                    <option value="POINTS_ASC">{siteConfig.playerDashboard.sortPointsAsc}</option>
                </select>
            </div>

            {Object.entries(tasksByType).map(([type, list]) => (
                <div key={type} style={{ marginTop: '16px' }}>
                    <h2 className="title" style={{ fontSize: '1.4rem', marginBottom: '20px', color: 'var(--text-main)', opacity: 0.9 }}>
                        {siteConfig.playerDashboard.tasksCategoryPrefix} {type}
                    </h2>
                    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                        {list.map(task => {
                            const taskInfo = canSubmitTask(task);
                            const sub = getTaskSubmission(task.id);
                            return (
                                <motion.div variants={itemVariants} whileHover={{ y: -2 }} key={task.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3, marginBottom: '6px' }}>{task.title}</h3>
                                            {task.description && <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.5 }}>{task.description}</p>}
                                            {taskInfo.count > 0 && (
                                                <div style={{ display: 'inline-block', fontSize: '0.85rem', color: 'var(--primary-dark)', backgroundColor: 'var(--primary-light)', padding: '4px 10px', borderRadius: '4px', marginTop: '12px', fontWeight: 600 }}>
                                                    {siteConfig.playerDashboard.submittedPrefix} {taskInfo.count} {siteConfig.playerDashboard.timesSuffix}
                                                </div>
                                            )}
                                        </div>
                                        <div className="badge badge-points" style={{ fontSize: '1rem', padding: '6px 16px' }}>+{task.points} {siteConfig.global.pointsSuffix}</div>
                                    </div>

                                    {/* Image/PDF preview for submitted tasks */}
                                    {sub?.imageUrl && (
                                        <motion.a whileHover={{ scale: 1.02 }} href={sub.imageUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: '8px' }}>
                                            {sub.imageUrl.toLowerCase().endsWith('.pdf') ? (
                                                <iframe src={sub.imageUrl} style={{ width: '100%', height: '180px', border: '1px solid rgba(58, 16, 30, 0.1)', borderRadius: 'var(--radius-sm)', pointerEvents: 'none' }} title="PDF Preview" />
                                            ) : (
                                                <div style={{ position: 'relative', width: '100%', height: '240px' }}>
                                                    <Image src={sub.imageUrl} alt="หลักฐาน" fill style={{ objectFit: 'cover', borderRadius: 'var(--radius-md)', background: 'var(--background)' }} sizes="(max-width: 768px) 100vw, 800px" />
                                                </div>
                                            )}
                                        </motion.a>
                                    )}

                                    <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(58, 16, 30, 0.06)' }}>
                                        {taskInfo.status === 'APPROVED' && !taskInfo.canSubmit && <span style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>✨ {siteConfig.playerDashboard.statusApprovedPaid}</span>}
                                        {taskInfo.status === 'APPROVED' && taskInfo.canSubmit && <span style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>✨ {siteConfig.playerDashboard.statusApprovedRepeat}</span>}
                                        {taskInfo.status === 'PENDING' && <span style={{ color: '#d97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>⏳ {siteConfig.playerDashboard.statusPending}</span>}
                                        {taskInfo.status === 'REJECTED' && <span style={{ color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>⚠️ {siteConfig.playerDashboard.statusRejected}</span>}
                                        {taskInfo.status === 'COOLDOWN' && <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>🕒 {siteConfig.playerDashboard.statusCooldown}</span>}

                                        {taskInfo.canSubmit && (
                                            <label className="btn-primary" style={{ display: 'inline-flex', marginTop: '16px', cursor: 'pointer' }}>
                                                {uploading === task.id ? siteConfig.playerDashboard.btnSubmitting : siteConfig.playerDashboard.btnSubmitFiles}
                                                <input
                                                    type="file"
                                                    accept="image/*,application/pdf"
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => handleFileUpload(task.id, e)}
                                                    disabled={uploading === task.id}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            ))}
        </div>
    );
}
