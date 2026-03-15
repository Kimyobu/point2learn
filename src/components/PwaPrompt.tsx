'use client';

import { useEffect, useState } from 'react';

export default function PwaPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        // Detect if already installed / running in standalone
        const isAppMode = ('standalone' in window.navigator && (window.navigator as any).standalone) || window.matchMedia('(display-mode: standalone)').matches;
        setIsStandalone(isAppMode);

        // Show prompt if on iOS and not yet installed, user hasn't dismissed recently
        if (isIosDevice && !isAppMode) {
            const dismissed = localStorage.getItem('pwa-prompt-dismissed');
            if (!dismissed) {
                setShowPrompt(true);
            }
        }
    }, []);

    const dismissPrompt = () => {
        setShowPrompt(false);
        // Hide for a week if dismissed
        localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    };

    if (!showPrompt) return null;

    return (
        <div style={{
            position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
            background: 'var(--surface)', color: 'var(--text-main)',
            padding: '16px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            zIndex: 9999, width: '90%', maxWidth: '350px',
            border: '2px solid var(--primary-light)', display: 'flex', flexDirection: 'column', gap: '12px',
            animation: 'fadeInUp 0.5s ease-out forwards'
        }}>
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translate(-50%, 20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{ margin: 0, color: 'var(--primary-dark)', fontSize: '1rem' }}>📱 เล่น P2L ให้เต็มจอ!</h4>
                <button onClick={dismissPrompt} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1, padding: '0 4px', color: 'gray' }}>×</button>
            </div>

            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>
                เพิ่มแอปนี้ลงในหน้าจอโฮมเพื่อใช้งานแบบแอปพลิเคชันเต็มรูปแบบ
            </p>

            <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                แอปเปิล (iOS): กด <b style={{ fontSize: '1.2rem' }}>⍗</b> (Share) ด้านล่าง <br />แล้วเลือก <b>"Add to Home Screen"</b> ➕
            </div>
        </div>
    );
}
