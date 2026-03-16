'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface AngPaoOverlayProps {
    visible: boolean;
    pointsReceived?: number;
    message?: string;
    onClose: () => void;
}

// ── Web Audio coin SFX ──────────────────────────────────────────────
function playCoinSFX() {
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx() as AudioContext;

        const playNote = (freq: number, startTime: number, duration: number, gain = 0.35) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + duration * 0.3);
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        const now = ctx.currentTime;
        // เหรียญหลายเสียงทยอยออกมา
        [880, 1050, 1320, 1100, 990, 1200, 880, 1400].forEach((freq, i) => {
            playNote(freq, now + i * 0.07, 0.25, 0.25 + Math.random() * 0.15);
        });
    } catch (e) {
        // browser block autoplay — no-op
    }
}

// ── generate random coins ────────────────────────────────────────────
function makeCoins(count = 28) {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: 30 + Math.random() * 40,        // % จากซ้าย (กลางๆ จอ)
        delay: Math.random() * 0.5,
        angle: -90 + (Math.random() - 0.5) * 180, // องศาพุ่ง
        dist: 120 + Math.random() * 220,           // px ที่พุ่งไป
        size: 20 + Math.random() * 18,
        spin: Math.random() > 0.5 ? 1 : -1,
    }));
}

export default function AngPaoOverlay({ visible, pointsReceived, message, onClose }: AngPaoOverlayProps) {
    const [phase, setPhase] = useState<'idle' | 'shake' | 'open' | 'coins' | 'done'>('idle');
    const [coins] = useState(() => makeCoins(28));
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!visible) {
            setPhase('idle');
            return;
        }
        // sequence
        setPhase('shake');
        timerRef.current = setTimeout(() => {
            setPhase('open');
            playCoinSFX();
            timerRef.current = setTimeout(() => {
                setPhase('coins');
                timerRef.current = setTimeout(() => {
                    setPhase('done');
                }, 1800);
            }, 300);
        }, 1000);

        return () => clearTimeout(timerRef.current);
    }, [visible]);

    if (!visible || !mounted) return null;

    return createPortal(
        <div
            onClick={phase === 'done' ? onClose : undefined}
            style={{
                position: 'fixed', 
                inset: 0, 
                zIndex: 999999, // เพิ่ม z-index ให้สูงขึ้นไปอีก
                background: 'rgba(0,0,0,0.85)', // ปรับให้มืดขึ้นเล็กน้อย (0.75 -> 0.85)
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: phase === 'done' ? 'pointer' : 'default',
            }}
        >
            <style>{`
                @keyframes angpao-shake {
                    0%,100% { transform: rotate(0deg) scale(1); }
                    20%      { transform: rotate(-8deg) scale(1.05); }
                    40%      { transform: rotate(8deg) scale(1.08); }
                    60%      { transform: rotate(-6deg) scale(1.05); }
                    80%      { transform: rotate(6deg) scale(1.03); }
                }
                @keyframes angpao-open-top {
                    from { transform: rotateX(0deg); opacity: 1; }
                    to   { transform: rotateX(-120deg) translateY(-20px); opacity: 0; }
                }
                @keyframes letter-slide-up {
                    0%   { transform: translateY(0); opacity: 0; }
                    100% { transform: translateY(-110px); opacity: 1; }
                }
                @keyframes coin-fly {
                    0%   { transform: translate(0,0) rotate(0deg) scale(0.5); opacity: 1; }
                    60%  { opacity: 1; }
                    100% { transform: translate(var(--cx), var(--cy)) rotate(calc(var(--spin)*720deg)) scale(0.3); opacity: 0; }
                }
                @keyframes angpao-pulse {
                    0%,100% { box-shadow: 0 0 0 0 rgba(255,200,0,0.6); }
                    50%     { box-shadow: 0 0 0 20px rgba(255,200,0,0); }
                }
                @keyframes result-pop {
                    0%   { transform: scale(0.3) translateY(40px); opacity: 0; }
                    70%  { transform: scale(1.1) translateY(-8px); }
                    100% { transform: scale(1) translateY(0); opacity: 1; }
                }
            `}</style>

            {/* ── ซองอั่งเปา ── */}
            <div style={{ position: 'relative', width: 180, height: 240, marginBottom: 24 }}>
                
                {/* จดหมาย/จดหมายเล็กๆ ในซอง */}
                {(phase === 'open' || phase === 'coins' || phase === 'done') && (
                    <div style={{
                        position: 'absolute', top: 20, left: 10, right: 10, height: 180,
                        background: '#fff',
                        borderRadius: 8,
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                        padding: '16px 12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        textAlign: 'center',
                        zIndex: 1,
                        animation: 'letter-slide-up 0.8s cubic-bezier(0.17, 0.67, 0.83, 0.67) forwards',
                    }}>
                        <p style={{ 
                            color: '#d00000', 
                            fontSize: '0.95rem', 
                            fontWeight: 800, 
                            lineHeight: 1.4,
                            margin: 0
                        }}>
                            อั่งเปานี้พี่ให้หนู 100 บาทนะคะ 💖
                        </p>
                    </div>
                )}

                {/* ตัวซอง (ส่วนล่าง) */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(160deg, #d00000 0%, #8b0000 100%)',
                    borderRadius: 20,
                    boxShadow: '0 8px 40px rgba(200,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: 8,
                    zIndex: 2,
                    animation: phase === 'shake' ? 'angpao-shake 0.35s ease-in-out infinite' :
                        (phase === 'open' || phase === 'coins') ? 'angpao-pulse 0.8s ease infinite' : 'none',
                }}>
                    {/* ลาย */}
                    <div style={{ fontSize: '3.5rem', lineHeight: 1 }}>🧧</div>
                    <div style={{ fontSize: '2rem', lineHeight: 1 }}>💛</div>
                    <div style={{ color: 'rgba(255,220,0,0.9)', fontSize: '0.9rem', fontWeight: 700, letterSpacing: 2 }}>
                        เปิดซอง
                    </div>
                </div>

                {/* ฝาซอง — เปิดพับขึ้น */}
                {(phase === 'open' || phase === 'coins' || phase === 'done') && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '42%',
                        background: 'linear-gradient(160deg, #ff2222 0%, #a00000 100%)',
                        borderRadius: '20px 20px 0 0',
                        transformOrigin: 'top center',
                        perspective: 400,
                        animation: 'angpao-open-top 0.5s ease-out forwards',
                        zIndex: 3,
                    }} />
                )}

                {/* เหรียญทอง พุ่งออกมา */}
                {(phase === 'coins' || phase === 'done') && coins.map(c => {
                    const rad = (c.angle * Math.PI) / 180;
                    const cx = Math.cos(rad) * c.dist;
                    const cy = Math.sin(rad) * c.dist;
                    return (
                        <div key={c.id} style={{
                            position: 'absolute',
                            top: '30%', left: '50%',
                            width: c.size, height: c.size,
                            marginLeft: -c.size / 2, marginTop: -c.size / 2,
                            borderRadius: '50%',
                            background: `radial-gradient(circle at 35% 35%, #ffe566, #d4a000)`,
                            border: '2px solid #f0c000',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                            zIndex: 4,
                            // @ts-ignore
                            '--cx': `${cx}px`,
                            '--cy': `${cy}px`,
                            '--spin': c.spin,
                            animation: `coin-fly 1.4s ease-out ${c.delay}s forwards`,
                        } as React.CSSProperties} />
                    );
                })}
            </div>

            {/* ── ผลลัพธ์ ── */}
            {phase === 'done' && (
                <div style={{
                    background: 'linear-gradient(135deg, #fff8e1, #fff3cd)',
                    border: '3px solid #f0c000',
                    borderRadius: 20,
                    padding: '24px 40px',
                    textAlign: 'center',
                    animation: 'result-pop 0.5s ease-out forwards',
                    boxShadow: '0 8px 40px rgba(200,150,0,0.4)',
                    zIndex: 5,
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎊</div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#8b0000', margin: '0 0 8px' }}>
                        เปิดซองสำเร็จ!
                    </h2>
                    {pointsReceived !== undefined && (
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: '#d4a000', marginBottom: 8 }}>
                            +{pointsReceived} pt ✨
                        </div>
                    )}
                    {message && (
                        <p style={{ color: '#555', fontSize: '1rem', margin: '8px 0 0' }}>{message}</p>
                    )}
                    <p style={{ color: '#999', fontSize: '0.85rem', marginTop: 16 }}>แตะเพื่อปิด</p>
                </div>
            )}

            {/* status text */}
            {phase !== 'done' && (
                <p style={{ color: 'rgba(255,220,0,0.85)', fontWeight: 700, fontSize: '1.1rem', marginTop: 8, letterSpacing: 1, zIndex: 5 }}>
                    {phase === 'shake' ? '🧧 กำลังเปิดซอง...' :
                        phase === 'open' ? '✨ เปิดออกแล้ว!' : '🪙 เหรียญทองกระจาย!'}
                </p>
            )}
        </div>,
        document.body
    );
}
