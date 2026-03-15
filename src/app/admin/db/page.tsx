'use client';

import { useEffect, useState } from 'react';

type ModelType = 'users' | 'tasks' | 'rewards' | 'submissions';

export default function DbEditorPage() {
    const [model, setModel] = useState<ModelType>('users');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Quick Edit row states
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});

    useEffect(() => {
        fetchData(model);
    }, [model]);

    const fetchData = async (m: ModelType) => {
        setLoading(true);
        const res = await fetch(`/api/admin/db?model=${m}`);
        if (res.ok) {
            const json = await res.json();
            setData(json.data);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ยืนยันการลบข้อมูลนี้ถาวร?')) return;
        const res = await fetch('/api/admin/db', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, id })
        });
        if (res.ok) {
            setData(data.filter(item => item.id !== id));
        } else {
            alert('ลบข้อมูลไม่สำเร็จ');
        }
    };

    const handleSaveRow = async () => {
        if (!editingId) return;

        // Strip read-only or sensitive fields if needed but rely on generic updates for now
        const payload = { model, id: editingId, data: { ...editForm } };
        delete payload.data.id;
        delete payload.data.createdAt;
        delete payload.data.updatedAt;

        // Force numeric conversions on known fields
        if (payload.data.points !== undefined) payload.data.points = Number(payload.data.points);
        if (payload.data.totalPointsEarned !== undefined) payload.data.totalPointsEarned = Number(payload.data.totalPointsEarned);
        if (payload.data.pointsCost !== undefined) payload.data.pointsCost = Number(payload.data.pointsCost);

        // Booleans
        if (payload.data.isActive !== undefined) payload.data.isActive = payload.data.isActive === 'true' || payload.data.isActive === true;
        if (payload.data.isAvailable !== undefined) payload.data.isAvailable = payload.data.isAvailable === 'true' || payload.data.isAvailable === true;
        if (payload.data.isGoogleForm !== undefined) payload.data.isGoogleForm = payload.data.isGoogleForm === 'true' || payload.data.isGoogleForm === true;

        const res = await fetch('/api/admin/db', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            setEditingId(null);
            await fetchData(model);
        } else {
            alert('บันทึกข้อมูลไม่สำเร็จ');
        }
    };

    const startEdit = (item: any) => {
        setEditingId(item.id);
        setEditForm({ ...item });
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '100%', overflowX: 'auto' }}>
            <h1 className="title" style={{ fontSize: '2rem', marginBottom: '8px' }}>🗄️ แก้ไขฐานข้อมูลตรง (DB Editor)</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>ปรับตัวเลข แต้ม ชื่อ ทันที สำหรับแอดมินเท่านั้น</p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button className={model === 'users' ? 'btn-primary' : 'btn-secondary'} style={{ width: 'auto' }} onClick={() => setModel('users')}>👤 Users</button>
                <button className={model === 'tasks' ? 'btn-primary' : 'btn-secondary'} style={{ width: 'auto' }} onClick={() => setModel('tasks')}>📝 Tasks</button>
                <button className={model === 'rewards' ? 'btn-primary' : 'btn-secondary'} style={{ width: 'auto' }} onClick={() => setModel('rewards')}>🎁 Rewards</button>
                <button className={model === 'submissions' ? 'btn-primary' : 'btn-secondary'} style={{ width: 'auto' }} onClick={() => setModel('submissions')}>✉️ Submissions</button>
            </div>

            <div className="card" style={{ marginBottom: '24px', padding: '16px', border: '1px solid var(--primary-light)', background: 'var(--surface)' }}>
                <h3 style={{ marginBottom: '8px', fontSize: '1rem' }}>📥 อัปโหลดฐานข้อมูลเก่า (.db)</h3>
                <p style={{ fontSize: '0.85rem', color: 'gray', marginBottom: '16px' }}>หากคุณมีไฟล์ `dev.db` จากเครื่องตัวเอง หรือสำรองไว้ สามารถส่งขึ้นระบบได้ที่นี่ (ระบบจะทับของเดิมทั้งหมด)</p>
                <input
                    type="file"
                    accept=".db"
                    id="db-upload"
                    style={{ fontSize: '0.9rem', width: '100%', padding: '12px', border: '2px dashed #ccc', borderRadius: '8px', cursor: 'pointer', background: 'white' }}
                    onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!confirm('ยืนยันระบบจะนำไฟล์นี้ไปทับฐานข้อมูลเดิมทั้งหมดบน Server แน่ใจหรือไม่?')) return;

                        setLoading(true);
                        const formData = new FormData();
                        formData.append('file', file);

                        try {
                            const res = await fetch('/api/admin/db-upload', { method: 'POST', body: formData });
                            const data = await res.json();
                            if (res.ok) {
                                alert(data.message || 'อัปโหลดเรียบร้อย โปรเจกต์อาจจะเริ่มการทำงานใหม่สักครู่');
                                fetchData(model);
                            } else {
                                alert('Error: ' + data.error);
                            }
                        } catch (err) {
                            alert('Upload failed');
                        }

                        // Clear input
                        (document.getElementById('db-upload') as HTMLInputElement).value = '';
                        setLoading(false);
                    }}
                />
            </div>

            {loading ? (
                <p>Loading records...</p>
            ) : (
                <div style={{ overflowX: 'auto', background: 'white', borderRadius: 'var(--radius-md)', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: 'var(--surface)', textAlign: 'left' }}>
                                <th style={{ padding: '12px 8px', borderBottom: '2px solid #ddd' }}>Actions</th>
                                {data.length > 0 && Object.keys(data[0]).map(key => (
                                    <th key={key} style={{ padding: '12px 8px', borderBottom: '2px solid #ddd' }}>{key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>
                                        {editingId === item.id ? (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={handleSaveRow} style={{ color: 'var(--success)', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 'bold' }}>Save</button>
                                                <button onClick={() => setEditingId(null)} style={{ color: 'gray', cursor: 'pointer', background: 'none', border: 'none' }}>Cancel</button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => startEdit(item)} style={{ color: 'var(--primary-dark)', cursor: 'pointer', background: 'none', border: 'none' }}>Edit</button>
                                                <button onClick={() => handleDelete(item.id)} style={{ color: 'var(--danger)', cursor: 'pointer', background: 'none', border: 'none' }}>Delete</button>
                                            </div>
                                        )}
                                    </td>

                                    {Object.keys(item).map(key => {
                                        if (editingId === item.id && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
                                            return (
                                                <td key={key} style={{ padding: '8px' }}>
                                                    <input
                                                        value={editForm[key] || ''}
                                                        onChange={e => setEditForm({ ...editForm, [key]: e.target.value })}
                                                        style={{ width: '100%', minWidth: '80px', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                                                    />
                                                </td>
                                            );
                                        }

                                        let val = item[key];
                                        if (typeof val === 'boolean') val = val ? 'true' : 'false';
                                        if (val === null) val = 'null';

                                        return (
                                            <td key={key} style={{ padding: '8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={String(val)}>
                                                {String(val)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {data.length === 0 && <p style={{ textAlign: 'center', padding: '16px', color: 'gray' }}>No records found</p>}
                </div>
            )}
        </div>
    );
}
