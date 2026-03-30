'use client';
import { apiFetch } from '@/lib/apiClient';
import Swal from 'sweetalert2';

import { useEffect, useState } from 'react';

type Task = { id: string; title: string; description: string; points: number; type: string; isActive: boolean };
type TaskType = { id: string; name: string; resetMode: string };

export default function TaskManagerPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '', points: 10, type: 'DAILY', customType: '', isGoogleForm: false });
    const [showCustomType, setShowCustomType] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');
    const [newTypeResetMode, setNewTypeResetMode] = useState('NONE');
    const [sortOption, setSortOption] = useState('NEWEST');
    const [showTypeManager, setShowTypeManager] = useState(false);

    useEffect(() => {
        fetchTasks();
        fetchTaskTypes();
    }, []);

    const fetchTasks = async () => {
        const res = await apiFetch('/api/tasks');
        if (res.ok) setTasks(await res.json());
    };

    const fetchTaskTypes = async () => {
        const res = await apiFetch('/api/task-types');
        if (res.ok) {
            const types = await res.json();
            setTaskTypes(types);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const res = await apiFetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            Swal.fire('สำเร็จ', 'สร้างภารกิจสำเร็จ!', 'success');
            setFormData({ title: '', description: '', points: 10, type: taskTypes[0]?.name || 'DAILY', customType: '', isGoogleForm: false });
            setShowCustomType(false);
            await fetchTasks();
        } else {
            Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการสร้างภารกิจ', 'error');
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ',
            text: 'ลบภารกิจนี้?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ลบข้อมูล',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#d33'
        });
        if (!result.isConfirmed) return;
        const res = await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
        if (res.ok) fetchTasks();
    };

    const handleCreateType = async () => {
        if (!newTypeName.trim()) return;
        const res = await apiFetch('/api/task-types', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newTypeName.trim(), resetMode: newTypeResetMode })
        });
        if (res.ok) {
            setNewTypeName('');
            setNewTypeResetMode('NONE');
            await fetchTaskTypes();
        } else {
            const data = await res.json();
            Swal.fire('ข้อผิดพลาด', data.error || 'เกิดข้อผิดพลาด', 'error');
        }
    };

    const handleDeleteType = async (id: string, name: string) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ',
            text: `ลบประเภท "${name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ลบข้อมูล',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#d33'
        });
        if (!result.isConfirmed) return;
        const res = await apiFetch(`/api/task-types?id=${id}`, { method: 'DELETE' });
        if (res.ok) fetchTaskTypes();
    };

    const RESET_MODE_OPTIONS = [
        { value: 'NONE', label: 'ไม่รีเซ็ต' },
        { value: 'DAILY', label: 'รีเซ็ตทุกวัน' },
        { value: 'EVERY_N_DAYS:2', label: 'ทุก 2 วัน' },
        { value: 'EVERY_N_DAYS:3', label: 'ทุก 3 วัน' },
        { value: 'N_PER_WEEK:5', label: '5 ครั้ง/สัปดาห์' },
        { value: 'N_PER_WEEK:3', label: '3 ครั้ง/สัปดาห์' },
        { value: 'N_PER_M_DAYS:3:7', label: '3 ครั้งในทุก 7 วัน' },
    ];

    return (
        <div className="animate-fade-in">
            <h1 className="title" style={{ fontSize: '2rem', marginBottom: '24px' }}>📝 จัดการภารกิจ</h1>

            {/* Type Manager Toggle */}
            <div className="card" style={{ marginBottom: '16px' }}>
                <button
                    onClick={() => setShowTypeManager(!showTypeManager)}
                    style={{ background: 'none', fontWeight: 600, color: 'var(--primary-dark)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}
                >
                    🏷️ จัดการประเภทภารกิจ {showTypeManager ? '▲' : '▼'}
                </button>

                {showTypeManager && (
                    <div style={{ marginTop: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            <input
                                className="input-field"
                                placeholder="ชื่อประเภทใหม่..."
                                style={{ flex: 1, minWidth: '120px' }}
                                value={newTypeName}
                                onChange={e => setNewTypeName(e.target.value)}
                            />
                            <select
                                className="input-field"
                                style={{ width: 'auto', minWidth: '140px' }}
                                value={newTypeResetMode}
                                onChange={e => setNewTypeResetMode(e.target.value)}
                            >
                                {RESET_MODE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <button
                                className="btn-primary"
                                style={{ padding: '8px 16px', width: 'auto', fontSize: '0.9rem' }}
                                onClick={handleCreateType}
                            >
                                + เพิ่ม
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {taskTypes.map(t => (
                                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--background)', borderRadius: 'var(--radius-sm)' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{t.name}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                                            ({RESET_MODE_OPTIONS.find(o => o.value === t.resetMode)?.label || t.resetMode})
                                        </span>
                                    </div>
                                    <button onClick={() => handleDeleteType(t.id, t.name)} style={{ color: 'var(--danger)', fontSize: '1rem' }}>🗑️</button>
                                </div>
                            ))}
                            {taskTypes.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ยังไม่มีประเภท กรุณาเพิ่มใหม่</p>}
                        </div>
                    </div>
                )}
            </div>

            {/* Create Task Form */}
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
                                        onClick={() => { setShowCustomType(false); setFormData({ ...formData, type: taskTypes[0]?.name || 'DAILY' }); }}
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
                                    {taskTypes.map(t => (
                                        <option key={t.id} value={t.name}>{t.name}</option>
                                    ))}
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

            {/* Task List */}
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
