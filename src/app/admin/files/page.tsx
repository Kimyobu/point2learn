'use client';

import { useEffect, useState } from 'react';

type FileItem = {
    name: string;
    isDirectory: boolean;
    size: number;
    updatedAt: string;
};

export default function FileExplorerPage() {
    const [path, setPath] = useState<string>('');
    const [items, setItems] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchFolder(path);
    }, [path]);

    const fetchFolder = async (folderPath: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/files?path=${encodeURIComponent(folderPath)}`);
            if (res.ok) {
                const data = await res.json();
                setItems(data.items);
            } else {
                alert('ไม่สามารถโหลดแฟ้มข้อมูลได้ อาจจะไม่มี फोลเดอร์นี้');
                setPath(''); // fallback to root
            }
        } catch (e) {
            alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    const navigateTo = (folderName: string) => {
        if (path === '') setPath(folderName);
        else setPath(path + '/' + folderName);
    };

    const goUp = () => {
        if (!path) return;
        const parts = path.split('/');
        parts.pop();
        setPath(parts.join('/'));
    };

    const handleDelete = async (itemName: string) => {
        if (!confirm(`ยืนยันลบ ${itemName} ถาวรหรือไม่?`)) return;

        const targetPath = path ? `${path}/${itemName}` : itemName;
        const res = await fetch(`/api/admin/files?path=${encodeURIComponent(targetPath)}`, { method: 'DELETE' });

        if (res.ok) {
            fetchFolder(path);
        } else {
            alert('ไม่สามารถลบข้อมูลได้ อาจติด Permissions');
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('action', 'upload');
        formData.append('file', file);
        formData.append('path', path);

        const res = await fetch('/api/admin/files', { method: 'POST', body: formData });
        if (res.ok) {
            fetchFolder(path);
        } else {
            alert('อัปโหลดไม่สำเร็จ หรือไม่มีสิทธิ์เขียนไฟล์ที่นี่');
        }
        setUploading(false);
        (document.getElementById('file-upload') as HTMLInputElement).value = '';
    };

    const handleCreateFolder = async () => {
        const folderName = prompt('ชื่อโฟลเดอร์ใหม่:');
        if (!folderName) return;

        const formData = new FormData();
        formData.append('action', 'mkdir');
        formData.append('folderName', folderName);
        formData.append('path', path);

        const res = await fetch('/api/admin/files', { method: 'POST', body: formData });
        if (res.ok) {
            fetchFolder(path);
        } else {
            alert('สร้างโฟลเดอร์ไม่สำเร็จ');
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024, dm = 2, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 className="title" style={{ fontSize: '2rem', marginBottom: '8px' }}>📂 File Explorer (Storage)</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>จัดการไฟล์ทั้งหมดใน Volume เซิร์ฟเวอร์ (/app/storage)</p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                    onClick={goUp}
                    disabled={!path}
                    className="btn-secondary"
                    style={{ width: 'auto', padding: '8px 12px' }}>
                    ⬆️ กลับ
                </button>
                <div style={{ background: 'white', padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid #ddd', flex: 1, minWidth: '200px' }}>
                    <strong>Path: </strong>/storage{path ? `/${path}` : ''}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                    <input
                        type="file"
                        id="file-upload"
                        onChange={handleUpload}
                        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                        disabled={uploading}
                    />
                    <button className="btn-primary" style={{ pointerEvents: 'none' }}>
                        {uploading ? 'กำลังอัปโหลด...' : '📤 อัปโหลดไฟล์ที่นี่'}
                    </button>
                </div>
                <button className="btn-secondary" style={{ width: 'auto' }} onClick={handleCreateFolder}>
                    📁 สร้างโฟลเดอร์ใหม่
                </button>
            </div>

            {loading ? (
                <p>Loading folder contents...</p>
            ) : (
                <div style={{ background: 'white', border: '1px solid #eee', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'var(--surface)', borderBottom: '2px solid #ddd' }}>
                                <th style={{ padding: '12px 16px' }}>ชื่อไฟล์</th>
                                <th style={{ padding: '12px 16px' }}>ขนาด</th>
                                <th style={{ padding: '12px 16px' }}>วันที่แก้ไข</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right' }}>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'gray' }}>โฟลเดอร์ว่างเปล่า</td>
                                </tr>
                            )}
                            {items.map(item => {
                                const targetPath = path ? `${path}/${item.name}` : item.name;
                                return (
                                    <tr key={item.name} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '12px 16px' }}>
                                            {item.isDirectory ? (
                                                <button onClick={() => navigateTo(item.name)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    📁 {item.name}
                                                </button>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    📄 {item.name}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px', color: 'gray' }}>
                                            {item.isDirectory ? '-' : formatBytes(item.size)}
                                        </td>
                                        <td style={{ padding: '12px 16px', color: 'gray' }}>
                                            {new Date(item.updatedAt).toLocaleString('th-TH')}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                {!item.isDirectory && (
                                                    <a href={`/api/admin/files?path=${targetPath}&download=1`} download={item.name} style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem' }}>
                                                        [โหลด]
                                                    </a>
                                                )}
                                                <button onClick={() => handleDelete(item.name)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
                                                    [ลบ]
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
