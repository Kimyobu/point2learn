'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Task = { id: string; title: string; description: string; points: number; type: string };
type Submission = { id: string; taskId: string; status: string; imageUrl: string | null; createdAt: string };
type TaskType = { id: string; name: string; resetMode: string };

export default function PlayerDashboard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
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
        const [tasksRes, subRes, msgRes, userRes, typesRes] = await Promise.all([
            fetch('/api/tasks'),
            fetch('/api/submissions'),
            fetch('/api/messages'),
            fetch('/api/auth/me'),
            fetch('/api/task-types'),
        ]);
        if (tasksRes.ok) setTasks(await tasksRes.json());
        if (subRes.ok) setSubmissions(await subRes.json());
        if (msgRes.ok) setMessages(await msgRes.json());
        if (userRes.ok) setUser((await userRes.json()).user);
        if (typesRes.ok) setTaskTypes(await typesRes.json());
    };

    const handleFileUpload = async (taskId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(taskId);
        const formData = new FormData();
        formData.append('taskId', taskId);
        formData.append('image', file);

        const res = await fetch('/api/submissions', { method: 'POST', body: formData });
        if (res.ok) {
            alert('ส่งผลงานเรียบร้อยแล้วค่ะ! รอที่รักตรวจน้า 💖');
            await fetchData();
        } else {
            alert('เกิดข้อผิดพลาดในการส่งผลงาน');
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
        <div className="animate-fade-in">
            {messages.length > 0 && messages.map(msg => (
                <div key={msg.id} className="card" style={{ marginBottom: '24px', background: 'var(--primary-dark)', color: 'white', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.5rem' }}>💌</span>
                    <p style={{ margin: 0, fontWeight: 500, lineHeight: 1.4 }}>{msg.content}</p>
                </div>
            ))}

            {user && (
                <div className="card" style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" style={{ width: 48, height: 48, borderRadius: '50%', background: user.avatarBg || 'transparent', objectFit: 'cover' }} loading="lazy" />
                        ) : (
                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: user.avatarBg || 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👤</div>
                        )}
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>📝 ฉายา: <b style={{ color: 'var(--primary-dark)' }}>{user.title || getLevelInfo(user.totalPointsEarned).title}</b></span>
                                <span style={{ fontSize: '0.9rem', background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
                                    Lv. {getLevelInfo(user.totalPointsEarned).level}
                                </span>
                            </h2>
                        </div>
                    </div>
                    <div style={{ width: '100%', background: '#eee', borderRadius: '10px', height: '12px', overflow: 'hidden', marginTop: '12px' }}>
                        <div style={{
                            width: `${Math.min(100, (user.totalPointsEarned - getLevelInfo(user.totalPointsEarned).min) / (getLevelInfo(user.totalPointsEarned).max - getLevelInfo(user.totalPointsEarned).min) * 100)}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, var(--primary), var(--primary-dark))',
                            transition: 'width 0.5s ease-in-out'
                        }} />
                    </div>
                    <p style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        พอยท์สะสมรวม: {user.totalPointsEarned} / {getLevelInfo(user.totalPointsEarned).max} pt
                    </p>
                </div>
            )}

            <div className="card" style={{ marginBottom: '32px', textAlign: 'center', background: 'linear-gradient(to right, var(--primary-light), var(--surface))' }}>
                <h1 className="title" style={{ fontSize: '2rem', marginBottom: '8px' }}>สวัสดีคนเก่ง วันนี้ทำได้ดีมากครับ! 💖</h1>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>สู้ๆ กับภารกิจวันนี้ เก็บพอยท์ไปแลกของรางวัลกันน้า 🎁</p>
            </div>

            {/* Banner for hidden approved quests */}
            {seenApproved && approvedCount > 0 && (
                <div className="card" style={{ marginBottom: '24px', background: 'var(--success)', color: 'white', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontWeight: 600 }}>✅ มี {approvedCount} ภารกิจที่สำเร็จแล้ว</span>
                    <Link href="/player/history" style={{ color: 'white', fontWeight: 700, textDecoration: 'underline' }}>ดูได้ที่ประวัติ 📖</Link>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <select
                    className="input-field"
                    style={{ width: 'auto', padding: '8px 12px', minWidth: '150px' }}
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                >
                    <option value="NEWEST">ใหม่ล่าสุด</option>
                    <option value="OLDEST">เก่าสุด</option>
                    <option value="POINTS_DESC">พอยท์ (มากไปน้อย)</option>
                    <option value="POINTS_ASC">พอยท์ (น้อยไปมาก)</option>
                </select>
            </div>

            {Object.entries(tasksByType).map(([type, list]) => (
                <div key={type} style={{ marginBottom: '32px' }}>
                    <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-dark)' }}>
                        ✨ หมวดหมู่: {type}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {list.map(task => {
                            const taskInfo = canSubmitTask(task);
                            const sub = getTaskSubmission(task.id);
                            return (
                                <div key={task.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>{task.title}</h3>
                                            {task.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>{task.description}</p>}
                                            {taskInfo.count > 0 && (
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>ส่งแล้ว {taskInfo.count} ครั้ง</p>
                                            )}
                                        </div>
                                        <div className="badge badge-points">+{task.points} pt</div>
                                    </div>

                                    {/* Image/PDF preview for submitted tasks */}
                                    {sub?.imageUrl && (
                                        <a href={sub.imageUrl} target="_blank" rel="noopener noreferrer">
                                            {sub.imageUrl.toLowerCase().endsWith('.pdf') ? (
                                                <iframe src={sub.imageUrl} style={{ width: '100%', height: '180px', border: '1px solid #eee', borderRadius: 'var(--radius-sm)', pointerEvents: 'none' }} title="PDF Preview" />
                                            ) : (
                                                <img src={sub.imageUrl} alt="หลักฐาน" loading="lazy"
                                                    style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: 'var(--radius-md)', background: 'var(--background)' }} />
                                            )}
                                        </a>
                                    )}

                                    <div style={{ marginTop: '8px' }}>
                                        {taskInfo.status === 'APPROVED' && !taskInfo.canSubmit && <span style={{ color: 'var(--success)', fontWeight: 600 }}>✅ สำเร็จแล้วได้รับพอยท์แล้ว!</span>}
                                        {taskInfo.status === 'APPROVED' && taskInfo.canSubmit && <span style={{ color: 'var(--success)', fontWeight: 600 }}>✅ ส่งได้อีก!</span>}
                                        {taskInfo.status === 'PENDING' && <span style={{ color: '#ffb703', fontWeight: 600 }}>⏳ รอที่รักชื่นชมผลงานอยู่...</span>}
                                        {taskInfo.status === 'REJECTED' && <span style={{ color: 'var(--danger)', fontWeight: 600 }}>❌ ต้องแก้นิดหน่อย ลองส่งใหม่น้า</span>}
                                        {taskInfo.status === 'COOLDOWN' && <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>🕐 ส่งครบโควต้าแล้ว รอรอบถัดไปน้า</span>}

                                        {taskInfo.canSubmit && (
                                            <label className="btn-primary" style={{ display: 'inline-flex', padding: '10px 20px', fontSize: '0.95rem', width: 'auto', marginTop: '4px', cursor: 'pointer' }}>
                                                {uploading === task.id ? 'กำลังส่ง...' : '📸 ส่งรูป/PDF ผลงานเลย!'}
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
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
