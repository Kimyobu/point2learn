'use client';

import { useEffect, useState } from 'react';

type Reward = { id: string; name: string; description: string; pointsCost: number; imageUrl: string | null };

export default function StorePage() {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [redeeming, setRedeeming] = useState<string | null>(null);
    const [gachaAnimating, setGachaAnimating] = useState<string | null>(null);
    const [userPoints, setUserPoints] = useState<number>(0);

    useEffect(() => {
        fetchRewards();
        fetchUser();
    }, []);

    const fetchUser = async () => {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
            const data = await res.json();
            setUserPoints(data.user?.points || 0);
        }
    };

    const fetchRewards = async () => {
        const res = await fetch('/api/rewards');
        if (res.ok) setRewards(await res.json());
    };

    const handleRedeem = async (reward: Reward) => {
        const isGacha = reward.name.includes('สุ่ม') || reward.name.toLowerCase().includes('gacha') || reward.name.includes('กล่อง');

        if (!confirm(isGacha ? `ใช้ ${reward.pointsCost} pt เพื่อเปิด ${reward.name} ลุ้นของรางวัลใช่ไหมคะ? 🎲` : `ต้องการแลก ${reward.name} ด้วย ${reward.pointsCost} pt ใช่ไหมคะ?`)) return;

        if (isGacha) {
            setGachaAnimating(reward.id);
            // Play fake animation wait for 2.5s
            await new Promise(r => setTimeout(r, 2500));
            setGachaAnimating(null);
        }

        setRedeeming(reward.id);
        const res = await fetch('/api/rewards/redeem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rewardId: reward.id })
        });

        const data = await res.json();
        if (res.ok) {
            alert(isGacha ? `🎉 ปิ๊งป๊องงงง! คุณเปิดได้รางวัล... ไปทวงกับที่รักเลย! \nพอยท์คงเหลือ: ${data.pointsRemaining} pt` : `🎉 แลกรางวัลสำเร็จ! ${data.message} \nพอยท์คงเหลือ: ${data.pointsRemaining} pt`);
            window.location.reload(); // Reload to refresh user points in layout
        } else {
            alert(data.error || 'พอยท์ไม่พอ หรือเกิดข้อผิดพลาดค่ะ');
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
            `}} />
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h1 className="title" style={{ fontSize: '2.5rem' }}>🎁 ร้านค้าเปิดแล้ว! 🎁</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>ใช้พอยท์ที่สะสมมา แลกของรางวัลสุดพิเศษจากที่รักได้เลย</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {rewards.length === 0 ? (
                    <p style={{ textAlign: 'center', width: '100%', color: 'var(--text-muted)' }}>ตอนนี้ยังไม่มีของรางวัลน้า รอสิ้นเดือนนะคะ 💕</p>
                ) : rewards.map(reward => {
                    const isAnimating = gachaAnimating === reward.id;
                    return (
                        <div key={reward.id} className={`card ${isAnimating ? 'gacha-shake' : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', border: isAnimating ? '3px solid var(--primary)' : 'none' }}>
                            {reward.imageUrl ? (
                                <img src={reward.imageUrl} alt={reward.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 'var(--radius-md) var(--radius-md) 0 0', marginBottom: '16px' }} loading="lazy" />
                            ) : (
                                <div style={{ width: '100%', height: '150px', background: 'var(--secondary-light)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', marginBottom: '16px' }}>
                                    {isAnimating ? '🎲' : '🎁'}
                                </div>
                            )}

                            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '4px' }}>{reward.name}</h3>
                            {reward.description && <p style={{ color: 'var(--text-muted)', flex: 1, marginBottom: '16px' }}>{reward.description}</p>}

                            <button
                                className={userPoints >= reward.pointsCost ? "btn-primary" : "btn-secondary"}
                                onClick={() => handleRedeem(reward)}
                                disabled={redeeming === reward.id || isAnimating || userPoints < reward.pointsCost}
                                style={{ marginTop: 'auto', opacity: userPoints < reward.pointsCost ? 0.6 : 1, cursor: userPoints < reward.pointsCost ? 'not-allowed' : 'pointer' }}
                            >
                                {isAnimating ? 'กำลังสุ่ม...' : redeeming === reward.id ? 'กำลังแลก...' : userPoints < reward.pointsCost ? `พอยท์ไม่พอ (-${reward.pointsCost} pt)` : `แลกเลย! (-${reward.pointsCost} pt)`}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
