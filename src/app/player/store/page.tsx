'use client';
import { apiFetch } from '@/lib/apiClient';

import { useEffect, useState } from 'react';
import { usePlayerUser } from '@/context/PlayerUser';
import AngPaoOverlay from '@/components/AngPaoOverlay';

type Reward = { id: string; name: string; description: string; pointsCost: number; imageUrl: string | null };

export default function StorePage() {
    const { user, refreshUser } = usePlayerUser();
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [redeeming, setRedeeming] = useState<string | null>(null);
    const [gachaAnimating, setGachaAnimating] = useState<string | null>(null);

    // Cooldown state
    const [cooldown, setCooldown] = useState(0);

    // Ang Pao state
    const [angPaoVisible, setAngPaoVisible] = useState(false);
    const [angPaoPoints, setAngPaoPoints] = useState<number | undefined>(undefined);
    const [angPaoMessage, setAngPaoMessage] = useState<string | undefined>(undefined);

    useEffect(() => {
        fetchRewards();
    }, []);

    // Cooldown timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const fetchRewards = async () => {
        const res = await apiFetch('/api/rewards');
        if (res.ok) setRewards(await res.json());
    };

    const handleRedeem = async (reward: Reward) => {
        if (cooldown > 0) return;

        const isAngPao = reward.name.includes('อั่งเปา') || reward.name.includes('angpao') || reward.name.toLowerCase().includes('ang pao');
        const isGacha = !isAngPao && (reward.name.includes('สุ่ม') || reward.name.toLowerCase().includes('gacha') || reward.name.includes('กล่อง'));

        if (!confirm(isAngPao
            ? `ใช้ ${reward.pointsCost} pt เพื่อเปิดซองอั่งเปา 🧧 ใช่ไหมคะ?`
            : isGacha
                ? `ใช้ ${reward.pointsCost} pt เพื่อเปิด ${reward.name} ลุ้นของรางวัลใช่ไหมคะ? 🎲`
                : `ต้องการแลก ${reward.name} ด้วย ${reward.pointsCost} pt ใช่ไหมคะ?`)
        ) return;

        if (isGacha) {
            setGachaAnimating(reward.id);
            await new Promise(r => setTimeout(r, 2500));
            setGachaAnimating(null);
        }

        setRedeeming(reward.id);
        const res = await apiFetch('/api/rewards/redeem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rewardId: reward.id })
        });

        const data = await res.json();
        if (res.ok) {
            // เริ่ม Cooldown หลังซื้อสำเร็จ
            setCooldown(5);
            refreshUser();

            if (isAngPao) {
                // แสดง overlay อั่งเปา
                setAngPaoPoints(undefined);
                setAngPaoMessage(data.message || `ได้รับ ${reward.name} แล้ว! ไปทวงกับที่รักเลย 💖`);
                setAngPaoVisible(true);
            } else {
                alert(isGacha
                    ? `🎉 ปิ๊งป๊องงงง! คุณเปิดได้รางวัล... ไปทวงกับที่รักเลย! \nพอยท์คงเหลือ: ${data.pointsRemaining} pt`
                    : `🎉 แลกรางวัลสำเร็จ! ${data.message} \nพอยท์คงเหลือ: ${data.pointsRemaining} pt`);
            }
        } else {
            alert(data.error || 'พอยท์ไม่พอ หรือเกิดข้อผิดพลาดค่ะ');
            setCooldown(2); // ซื้อพลาดก็มีคูลดาวน์สั้นๆ
        }
        setRedeeming(null);
    };

    return (
        <div className="animate-fade-in">
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shake {
                    0% { transform: translate(1px, 1px) rotate(0deg); }
                    10% { transform: translate(-1px, -2px) rotate(-1deg); }
                    20% { transform: translate(-3px, 0px) rotate(1deg); }
                    30% { transform: translate(3px, 2px) rotate(0deg); }
                    40% { transform: translate(1px, -1px) rotate(1deg); }
                    50% { transform: translate(-1px, 2px) rotate(-1deg); }
                    60% { transform: translate(-3px, 1px) rotate(0deg); }
                    70% { transform: translate(3px, 1px) rotate(-1deg); }
                    80% { transform: translate(-1px, -1px) rotate(1deg); }
                    90% { transform: translate(1px, 2px) rotate(0deg); }
                    100% { transform: translate(1px, -2px) rotate(-1deg); }
                }
                .gacha-shake {
                    animation: shake 0.5s;
                    animation-iteration-count: infinite;
                }
                @keyframes angpao-glow {
                    0%,100% { box-shadow: 0 0 10px 2px rgba(220,0,0,0.4), 0 4px 24px rgba(0,0,0,0.2); }
                    50%     { box-shadow: 0 0 28px 8px rgba(255,200,0,0.7), 0 4px 24px rgba(0,0,0,0.2); }
                }
                .angpao-card {
                    animation: angpao-glow 1.8s ease-in-out infinite;
                    border: 2px solid #d00000 !important;
                }
            `}} />

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h1 className="title" style={{ fontSize: '2.5rem' }}>🎁 ร้านค้าเปิดแล้ว! 🎁</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>ใช้พอยท์ที่สะสมมา แลกของรางวัลสุดพิเศษจากที่รักได้เลย</p>
                {cooldown > 0 && (
                    <p style={{ color: 'var(--primary)', fontWeight: 600, marginTop: 8 }}>
                        ⏳ กรุณารอสักครู่... ({cooldown}s)
                    </p>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {rewards.length === 0 ? (
                    <p style={{ textAlign: 'center', width: '100%', color: 'var(--text-muted)' }}>ตอนนี้ยังไม่มีของรางวัลน้า รอสิ้นเดือนนะคะ 💕</p>
                ) : rewards.map(reward => {
                    const isAnimating = gachaAnimating === reward.id;
                    const isAngPao = reward.name.includes('อั่งเปา') || reward.name.includes('angpao') || reward.name.toLowerCase().includes('ang pao');
                    const hasEnoughPoints = (user?.points ?? 0) >= reward.pointsCost;
                    const isCooldown = cooldown > 0;

                    return (
                        <div
                            key={reward.id}
                            className={`card ${isAnimating ? 'gacha-shake' : ''} ${isAngPao ? 'angpao-card' : ''}`}
                            style={{ display: 'flex', flexDirection: 'column', height: '100%', border: isAnimating ? '3px solid var(--primary)' : undefined }}
                        >
                            {/* รูป / placeholder */}
                            {reward.imageUrl ? (
                                <img src={reward.imageUrl} alt={reward.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 'var(--radius-md) var(--radius-md) 0 0', marginBottom: '16px' }} loading="lazy" />
                            ) : (
                                <div style={{
                                    width: '100%', height: '150px',
                                    background: isAngPao
                                        ? 'linear-gradient(135deg, #b30000 0%, #e60000 40%, #d4a000 100%)'
                                        : 'var(--secondary-light)',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '3.5rem', marginBottom: '16px',
                                    position: 'relative', overflow: 'hidden',
                                }}>
                                    {isAngPao ? (
                                        <>
                                            <span style={{ fontSize: '4rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}>🧧</span>
                                            {/* ลายประดับ */}
                                            <span style={{ position: 'absolute', top: 6, right: 10, fontSize: '1.2rem', opacity: 0.7 }}>✨</span>
                                            <span style={{ position: 'absolute', bottom: 6, left: 10, fontSize: '1.2rem', opacity: 0.7 }}>💛</span>
                                        </>
                                    ) : (
                                        isAnimating ? '🎲' : '🎁'
                                    )}
                                </div>
                            )}

                            {/* badge พิเศษ */}
                            {isAngPao && (
                                <div style={{
                                    background: 'linear-gradient(90deg, #d00000, #d4a000)',
                                    color: 'white', fontSize: '0.75rem', fontWeight: 800,
                                    padding: '3px 10px', borderRadius: 20, alignSelf: 'flex-start',
                                    marginBottom: 6, letterSpacing: 1,
                                }}>
                                    ✨ ไอเทมพิเศษ
                                </div>
                            )}

                            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: isAngPao ? '#8b0000' : 'var(--primary-dark)', marginBottom: '4px' }}>
                                {reward.name}
                            </h3>
                            {reward.description && <p style={{ color: 'var(--text-muted)', flex: 1, marginBottom: '16px' }}>{reward.description}</p>}

                            <button
                                className={hasEnoughPoints && !isCooldown ? 'btn-primary' : 'btn-secondary'}
                                onClick={() => handleRedeem(reward)}
                                disabled={redeeming === reward.id || isAnimating || !hasEnoughPoints || isCooldown}
                                style={{
                                    marginTop: 'auto',
                                    opacity: (!hasEnoughPoints || isCooldown) ? 0.6 : 1,
                                    cursor: (!hasEnoughPoints || isCooldown) ? 'not-allowed' : 'pointer',
                                    ...(isAngPao && hasEnoughPoints && !isCooldown ? {
                                        background: 'linear-gradient(90deg, #c00000, #d4a000)',
                                        border: 'none',
                                    } : {}),
                                }}
                            >
                                {isAnimating ? 'กำลังสุ่ม...' :
                                    redeeming === reward.id ? 'กำลังทำรายการ...' :
                                        isCooldown ? `รอสักครู่ (${cooldown}s)` :
                                            !hasEnoughPoints ? `พอยท์ไม่พอ (-${reward.pointsCost} pt)` :
                                                isAngPao ? <p>🧧 เปิดซองอั่งเปา!<br />(-{reward.pointsCost} pt)</p> :
                                                    `แลกเลย! (-${reward.pointsCost} pt)`}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Ang Pao overlay */}
            <AngPaoOverlay
                visible={angPaoVisible}
                pointsReceived={angPaoPoints}
                message={angPaoMessage}
                onClose={() => {
                    setAngPaoVisible(false);
                    window.location.reload();
                }}
            />
        </div>
    );
}
