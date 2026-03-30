'use client';
import { apiFetch } from '@/lib/apiClient';
import Swal from 'sweetalert2';

import { useEffect, useState } from 'react';

type Message = { id: string; content: string; createdAt: string };

export default function MessageManagerPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState('');

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        const res = await apiFetch('/api/messages');
        if (res.ok) setMessages(await res.json());
    };

    const handleCreateMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const res = await apiFetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });

        if (res.ok) {
            Swal.fire('สำเร็จ', 'ส่งจดหมายลับสำเร็จ!', 'success');
            setContent('');
            await fetchMessages();
        } else {
            Swal.fire('ผิดพลาด', 'เกิดข้อผิดพลาดในการส่งข้อความ', 'error');
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ',
            text: 'ลบข้อความนี้? (จะหายไปจากหน้าจอแฟน)',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ลบเลย',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#d33'
        });
        if (!result.isConfirmed) return;
        const res = await apiFetch(`/api/messages/${id}`, { method: 'DELETE' });
        if (res.ok) fetchMessages();
    };

    return (
        <div className="animate-fade-in">
            <h1 className="title" style={{ fontSize: '2rem', marginBottom: '24px' }}>💌 จดหมายลับให้กำลังใจ</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                ข้อความที่คุณเขียนที่นี่ จะไปโผล่บนหน้า Dashboard ของแฟนเป็นป้ายประกาศ (Banner) น่ารักๆ เซอร์ไพรส์ตอนเช้าครับ
            </p>

            <div className="card" style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--primary-dark)' }}>+ เขียนความในใจใหม่</h2>
                <form onSubmit={handleCreateMessage} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <textarea
                        className="input-field"
                        placeholder="พิมพ์ข้อความน่ารักๆ หรือคำทักทายตอนเช้า..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        required
                        rows={4}
                        style={{ resize: 'vertical' }}
                    />
                    <button type="submit" className="btn-primary" disabled={loading} style={{ alignSelf: 'flex-start', width: 'auto' }}>
                        {loading ? 'กำลังส่ง...' : '💌 ส่งจดหมายลับ'}
                    </button>
                </form>
            </div>

            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-muted)' }}>ข้อความที่กำลังแสดง ({messages.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>ตอนนี้ยังไม่มีข้อความบนหน้า Dashboard ครับ</p>
                ) : messages.map(msg => (
                    <div key={msg.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--primary-light)' }}>
                        <div>
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '8px' }}>{msg.content}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>เขียนเมื่อ: {new Date(msg.createdAt).toLocaleString()}</p>
                        </div>
                        <button
                            onClick={() => handleDelete(msg.id)}
                            style={{ color: 'var(--danger)', fontSize: '1.5rem', padding: '8px' }}
                            title="ลบข้อความ"
                        >
                            🗑️
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
