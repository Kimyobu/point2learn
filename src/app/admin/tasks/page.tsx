'use client';

import { useEffect, useState } from 'react';

type Task = { id: string; title: string; description: string; points: number; type: string; isActive: boolean };

export default function TaskManagerPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '', points: 10, type: 'DAILY', customType: '', isGoogleForm: false });
    const [showCustomType, setShowCustomType] = useState(false);
    const [sortOption, setSortOption] = useState('NEWEST');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        const res = await fetch('/api/tasks');
        if (res.ok) setTasks(await res.json());
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            alert('สร้างภารกิจสำเร็จ!');
            setFormData({ title: '', description: '', points: 10, type: 'DAILY', customType: '', isGoogleForm: false });
            setShowCustomType(false);
            await fetchTasks();
        } else {
            alert('เกิดข้อผิดพลาดในการสร้างภารกิจ');
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ลบภารกิจนี้?')) return;
        const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        if (res.ok) fetchTasks();
    };

    return (
        <div className="animate-fade-in">
            <h1 className="title" style={{ fontSize: '2rem', marginBottom: '24px' }}>📝 จัดการภารกิจ</h1>

            <div className="card" style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--primary-dark)' }}>+ เพิ่มภารกิจใหม่</h2>
                <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input
                        className="input-field" placeholder="ชื่อภารกิจ (เช่น อ่านจบ 1 บท)" required
                        value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                    <input
                        className="input-field" placeholder="รายละเอียด (ไม่บังคับ)"
                        value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-muted)' }}>จำนวนพอยท์</label>
                            <input
                                type="number" className="input-field" required min="1"
                                value={formData.points} onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) })}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-muted)' }}>ประเภท</label>
                            {showCustomType ? (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        className="input-field"
                                        placeholder="พิมพ์หมวดหมู่ใหม่..."
                                        value={formData.customType}
                                        onChange={e => setFormData({ ...formData, customType: e.target.value, type: e.target.value })}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => { setShowCustomType(false); setFormData({ ...formData, type: 'DAILY' }); }}
                                        style={{ padding: '8px', background: '#eee', borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap' }}
                                    >
                                        ยกเลิก
                                    </button>
                                </div>
                            ) : (
                                <select
                                    className="input-field"
                                    value={formData.type}
                                    onChange={e => {
                                        if (e.target.value === 'CUSTOM') {
                                            setShowCustomType(true);
                                            setFormData({ ...formData, type: formData.customType });
                                        } else {
                                            setFormData({ ...formData, type: e.target.value });
                                        }
                                    }}
                                >
                                    <option value="DAILY">ประจำวัน ☀️</option>
                                    <option value="SUMMER">ปิดเทอม 🏖️</option>
                                    <option value="CUSTOM">+ เพิ่มหมวดหมู่ใหม่</option>
                                </select>
                            )}
                        </div>
                        <div style={{ flex: 1, minWidth: '150px', display: 'flex', alignItems: 'flex-end', paddingBottom: '10px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.isGoogleForm}
                                    onChange={e => setFormData({ ...formData, isGoogleForm: e.target.checked })}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                ใช้งานผ่าน Google Forms 📝
                            </label>
                        </div>
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ alignSelf: 'flex-start', width: 'auto' }}>
                        {loading ? 'กำลังบันทึก...' : 'บันทึกภารกิจ'}
                    </button>
                </form>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-muted)' }}>ภารกิจทั้งหมด ({tasks.length})</h2>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(() => {
                    let result = [...tasks];
                    if (sortOption === 'NEWEST') result.reverse();
                    if (sortOption === 'POINTS_DESC') result.sort((a, b) => b.points - a.points);
                    if (sortOption === 'POINTS_ASC') result.sort((a, b) => a.points - b.points);
                    return result;
                })().map(task => (
                    <div key={task.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                        <div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                                <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{task.title}</h3>
                                <span className="badge badge-points">{task.points} pt</span>
                                <span className="badge" style={{ background: '#eee', color: '#666' }}>{task.type}</span>
                            </div>
                            {task.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{task.description}</p>}
                        </div>
                        <button
                            onClick={() => handleDelete(task.id)}
                            style={{ color: 'var(--danger)', fontSize: '1.2rem', padding: '8px' }}
                            title="ลบภารกิจ"
                        >
                            🗑️
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
