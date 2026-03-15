'use client';

import { useEffect, useState } from 'react';

type Task = { id: string; title: string; description: string; points: number; type: string };
type Submission = { id: string; taskId: string; status: string };

export default function PlayerDashboard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [uploading, setUploading] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const [tasksRes, subRes, msgRes, userRes] = await Promise.all([
            fetch('/api/tasks'),
            fetch('/api/submissions'),
            fetch('/api/messages'),
            fetch('/api/auth/me')
        ]);
        if (tasksRes.ok) setTasks(await tasksRes.json());
        if (subRes.ok) setSubmissions(await subRes.json());
        if (msgRes.ok) setMessages(await msgRes.json());
        if (userRes.ok) setUser((await userRes.json()).user);
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

    const getTaskStatus = (taskId: string) => {
        const sub = submissions.find(s => s.taskId === taskId);
        if (!sub) return null;
        return sub.status; // PENDING, APPROVED, REJECTED
    };

    const getLevelInfo = (totalPoints: number) => {
        if (totalPoints < 50) return { title: 'ผู้เริ่มต้น 🌱', min: 0, max: 50, level: 0 };
        if (totalPoints < 150) return { title: 'เด็กดี 👧', min: 50, max: 150, level: 1 };
        if (totalPoints < 300) return { title: 'คนเก่งของเค้า 💖', min: 150, max: 300, level: 2 };
        if (totalPoints < 500) return { title: 'ที่รัก 💕', min: 300, max: 500, level: 3 };
        if (totalPoints < 1000) return { title: 'เจ้าหญิงของเค้า 👑', min: 500, max: 1000, level: 4 };
        return { title: 'สุดยอดนางฟ้า 👼', min: 1000, max: 1000, level: 5 };
    };

    const tasksByType = tasks.reduce((acc, task) => {
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

            {Object.entries(tasksByType).map(([type, list]) => (
                <div key={type} style={{ marginBottom: '32px' }}>
                    <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-dark)' }}>
                        ✨ หมวดหมู่: {type}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {list.map(task => {
                            const status = getTaskStatus(task.id);
                            return (
                                <div key={task.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>{task.title}</h3>
                                            {task.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>{task.description}</p>}
                                        </div>
                                        <div className="badge badge-points">+{task.points} pt</div>
                                    </div>

                                    <div style={{ marginTop: '8px' }}>
                                        {status === 'APPROVED' && <span style={{ color: 'var(--success)', fontWeight: 600 }}>✅ สำเร็จแล้วได้รับพอยท์แล้ว!</span>}
                                        {status === 'PENDING' && <span style={{ color: '#ffb703', fontWeight: 600 }}>⏳ รอที่รักชื่นชมผลงานอยู่...</span>}
                                        {status === 'REJECTED' && <span style={{ color: 'var(--danger)', fontWeight: 600 }}>❌ ต้องแก้นิดหน่อย ลองส่งใหม่น้า</span>}

                                        {(!status || status === 'REJECTED') && (
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
