'use client';

import { useEffect, useState } from 'react';

export default function PwaPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        // Detect OS
        const userAgent = window.navigator.userAgent.toLowerCase();
        console.log(userAgent);
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !!(navigator.maxTouchPoints && (navigator.maxTouchPoints > 2));
        const isAndroidDevice = /android/.test(userAgent);

        setIsIOS(isIosDevice);
        setIsAndroid(isAndroidDevice);

        // Detect if already installed / running in standalone
        const isAppMode = ('standalone' in window.navigator && (window.navigator as any).standalone) || window.matchMedia('(display-mode: standalone)').matches;
        setIsStandalone(isAppMode);

        const dismissed = localStorage.getItem('pwa-prompt-dismissed');

        // Show prompt if on iOS and not yet installed, user hasn't dismissed recently
        if (isIosDevice && !isAppMode && !dismissed) {
            setShowPrompt(true);
        }

        // Android / Chrome installation event
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            if (!dismissed && isAndroidDevice) {
                setShowPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const dismissPrompt = () => {
        setShowPrompt(false);
        // Hide for a week if dismissed
        localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    };

    const installPWA = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    };

    const handleShareIOS = async () => {
        // ข้อมูลที่จะแชร์
        const shareData = {
            title: 'Point2Learn',
            text: 'Point2Learn - แพลตฟอร์มเรียนรู้แบบมีส่วนร่วม',
            url: window.location.href,
        };

        try {
            // ตรวจสอบว่า Browser รองรับ Web Share API หรือไม่
            if (navigator.share) {
                await navigator.share(shareData);
                console.log('แชร์สำเร็จ');
            } else {
                // กรณี Browser ไม่รองรับ (เช่น Chrome บน Desktop) 
                // อาจจะเปลี่ยนเป็น Copy Link ลง Clipboard แทน
                alert('ระบบไม่รองรับการแชร์อัตโนมัติ');
            }
        } catch (err) {
            // กรณี User กดยกเลิก (Cancel) หรือปิดหน้าแชร์
            console.log('User cancelled or error:', err);
        }
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

            {isIOS && (
                <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                    แอปเปิล (iOS): กด <b style={{ fontSize: '1.2rem' }}>⍗</b> (Share) ด้านล่าง
                    <br /> <button
                        onClick={handleShareIOS}
                        style={{
                            backgroundColor: '#007AFF',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '10px',
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        📤 แชร์หน้านี้
                    </button>
                    <br />แล้วเลือก <b>"Add to Home Screen"</b> ➕
                </div>
            )}

            {isAndroid && (
                <button
                    onClick={installPWA}
                    style={{
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                        color: 'white', border: 'none', padding: '10px', borderRadius: '8px',
                        fontWeight: 'bold', cursor: 'pointer', marginTop: '4px'
                    }}
                >
                    ติดตั้งแอป P2L (Install) 🚀
                </button>
            )}
        </div>
    );
}
