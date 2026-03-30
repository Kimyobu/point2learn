'use client';
import { apiFetch } from '@/lib/apiClient';
import Swal from 'sweetalert2';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { usePlayerUser } from '@/context/PlayerUser';
import AngPaoOverlay from '@/components/AngPaoOverlay';
import { siteConfig } from '@/config/site';

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { ease: [0.25, 1, 0.5, 1] as const, duration: 0.4 } }
};

type Reward = { id: string; name: string; description: string; pointsCost: number; imageUrl: string | null; stock: number, cooldownMin: number };
type RedeemLog = {
    id: string;
    rewardName: string;
    rewardId: string;
    pointsSpent: number;
    isGacha: boolean;
    redeemAt: string;
    stockRemaining: number;
    user?: { username: string; displayName: string | null };
};

export default function StorePage() {
    const { user, refreshUser } = usePlayerUser();
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [redeeming, setRedeeming] = useState<string | null>(null);
    const [gachaAnimating, setGachaAnimating] = useState<string | null>(null);

    // Cooldown state
    const [cooldownMax, setCooldownMax] = useState(0);
    const [globalCooldown, setGlobalCooldown] = useState(0);

    // Ang Pao state
    const [angPaoVisible, setAngPaoVisible] = useState(false);
    const [angPaoPoints, setAngPaoPoints] = useState<number | undefined>(undefined);
    const [angPaoMessage, setAngPaoMessage] = useState<string | undefined>(undefined);

    const [redeemLogs, setRedeemLogs] = useState<RedeemLog[]>([]);

    useEffect(() => {
        fetchRewards();
    }, []);

    // Cooldown timer
    useEffect(() => {
        if (cooldownMax > 0) {
            const timer = setTimeout(() => {
                setCooldownMax(cooldownMax - 1)
                if (globalCooldown > 0) setGlobalCooldown(globalCooldown - 1)
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldownMax]);

    const fetchRewards = async () => {
        const res = await apiFetch('/api/rewards');
        if (res.ok) setRewards(await res.json());
        const res2 = await apiFetch(`/api/redeem-logs`)
        if (res2.ok) setRedeemLogs(await res2.json());
    };

    const handleRedeem = async (reward: Reward) => {
        if (globalCooldown > 0) return;

        const isAngPao = reward.name.includes('อั่งเปา') || reward.name.includes('angpao') || reward.name.toLowerCase().includes('ang pao');
        const isGacha = !isAngPao && (reward.name.includes('สุ่ม') || reward.name.toLowerCase().includes('gacha') || reward.name.includes('กล่อง'));

        const confirmResult = await Swal.fire({
            title: 'ยืนยันการแลกรางวัล',
            text: isAngPao
                ? `${siteConfig.playerStore.confirmAngPaoPrefix} ${reward.pointsCost} ${siteConfig.playerStore.confirmAngPaoSuffix}`
                : isGacha
                    ? `${siteConfig.playerStore.confirmGachaPrefix} ${reward.pointsCost} ${siteConfig.playerStore.confirmGachaSuffix}`
                    : `ต้องการแลก ${reward.name} ด้วย ${reward.pointsCost} ${siteConfig.playerStore.confirmNormalSuffix}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'แลกเลย',
            cancelButtonText: 'ยกเลิก'
        });

        if (!confirmResult.isConfirmed) return;

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
            setGlobalCooldown(5);
            refreshUser();

            if (isAngPao) {
                // แสดง overlay อั่งเปา
                setAngPaoPoints(undefined);
                setAngPaoMessage(data.message || `ได้รับ ${reward.name} แล้ว! ไปทวงกับที่รักเลย 💖`);
                setAngPaoVisible(true);
            } else {
                Swal.fire('สำเร็จ', isGacha
                    ? `${siteConfig.playerStore.alertGachaSuccess} \nพอยท์คงเหลือ: ${data.pointsRemaining} ${siteConfig.global.pointsSuffix}`
                    : `${siteConfig.playerStore.alertRedeemSuccess} ${data.message} \nพอยท์คงเหลือ: ${data.pointsRemaining} ${siteConfig.global.pointsSuffix}`, 'success');
            }
        } else {
            Swal.fire('ข้อผิดพลาด', data.error || siteConfig.playerStore.alertError, 'error');
            setGlobalCooldown(2); // ซื้อพลาดก็มีคูลดาวน์สั้นๆ
        }
        setRedeeming(null);
        fetchRewards();
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

            <div style={{ textAlign: 'left', marginTop: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
                <h1 className="title" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '8px', lineHeight: 1.1 }}>
                    {siteConfig.playerStore.headline} ✨
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
                    {siteConfig.playerStore.subheadline}
                </p>
                {globalCooldown > 0 && (
                    <div style={{
                        marginTop: '16px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(238, 114, 20, 0.1)',
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-full)',
                        color: '#d97706',
                        fontWeight: 600
                    }}>
                        ⏳ {siteConfig.playerStore.btnCooldownWait}... ({globalCooldown}s)
                    </div>
                )}
            </div>

            <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {rewards.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
                        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px', opacity: 0.5 }}>🍃</span>
                        {siteConfig.playerStore.emptyStore}
                    </div>
                ) : rewards.map(reward => {


                    const isAnimating = gachaAnimating === reward.id;
                    const isAngPao = reward.name.includes('อั่งเปา') || reward.name.includes('angpao') || reward.name.toLowerCase().includes('ang pao');
                    const hasEnoughPoints = (user?.points ?? 0) >= reward.pointsCost;

                    const log = redeemLogs.find(log => log.rewardId === reward.id);

                    let cooldown = 0
                    if (reward.cooldownMin > 0 && log && log.redeemAt) {
                        const timeDiff = Date.now() - new Date(log.redeemAt).getTime();
                        const cooldownSeconds = reward.cooldownMin * 60;
                        if (timeDiff < cooldownSeconds * 1000) {
                            cooldown = cooldownSeconds - (timeDiff / 1000);
                        }
                    } else cooldown = globalCooldown
                    if (cooldown > cooldownMax) setCooldownMax(cooldown)
                    const isCooldown = cooldown > 0;

                    const isOutofStock = reward.stock <= 0

                    return (
                        <motion.div
                            key={reward.id}
                            variants={itemVariants}
                            whileHover={{ y: -4, scale: 1.02 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className={`card ${isAnimating ? 'gacha-shake' : ''} ${isAngPao ? 'angpao-card' : ''}`}
                            style={{ display: 'flex', flexDirection: 'column', height: '100%', border: isAnimating ? '3px solid var(--primary)' : undefined }}
                        >
                            {/* รูป / placeholder */}
                            {reward.imageUrl ? (
                                <div style={{ position: 'relative', width: '100%', height: '150px', marginBottom: '16px' }}>
                                    <Image src={reward.imageUrl} alt={reward.name} fill sizes="(max-width: 768px) 100vw, 300px" style={{ objectFit: 'cover', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }} />
                                </div>
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
                                    background: 'var(--text-main)',
                                    color: '#ffffff', fontSize: '0.75rem', fontWeight: 700,
                                    padding: '4px 12px', borderRadius: 'var(--radius-full)', alignSelf: 'flex-start',
                                    marginBottom: '12px', letterSpacing: '0.05em',
                                    textTransform: 'uppercase'
                                }}>
                                    ✨ {siteConfig.playerStore.itemSpecialBadge}
                                </div>
                            )}

                            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', lineHeight: 1.2 }}>
                                {reward.name}
                            </h3>
                            <p>ราคา: {reward.pointsCost}{siteConfig.global.pointsSuffix}</p>
                            <p style={{ marginBottom: '12px' }}>เหลือ: {reward.stock}</p>
                            {reward.description && <p style={{ color: 'var(--text-muted)', flex: 1, marginBottom: '24px', fontSize: '1rem', lineHeight: 1.5 }}>{reward.description}</p>}

                            <button
                                className={hasEnoughPoints && !isCooldown && !isOutofStock ? 'btn-primary' : 'btn-secondary'}
                                onClick={() => handleRedeem(reward)}
                                disabled={redeeming === reward.id || isAnimating || !hasEnoughPoints || isCooldown || isOutofStock}
                                style={{
                                    marginTop: 'auto',
                                    opacity: 1,
                                    cursor: (!hasEnoughPoints || isCooldown) ? 'not-allowed' : 'pointer',
                                    justifyContent: 'center',
                                    padding: '16px',
                                    border: 'none',
                                    ...(isAngPao && hasEnoughPoints && !isCooldown ? {
                                        background: 'linear-gradient(135deg, #c00000 0%, #a00000 100%)',
                                        color: 'white',
                                        boxShadow: '0 8px 16px rgba(192, 0, 0, 0.25)',
                                    } : {}),
                                }}
                            >
                                {isOutofStock ? siteConfig.playerStore.btnOutofStock :
                                    isAnimating ? siteConfig.playerStore.btnGachaAnimating :
                                        redeeming === reward.id ? siteConfig.playerStore.btnRedeeming :
                                            isCooldown ? `${cooldown >= 60 ? `${Math.floor(cooldown / 60)}m${Math.floor(cooldown % 60)}s` : `${Math.floor(cooldown)}s`}` :
                                                !hasEnoughPoints ? `${siteConfig.playerStore.btnInsufficientPoints})` :
                                                    isAngPao ? <span>🧧 {siteConfig.playerStore.btnRedeemAngPao}</span> :
                                                        <span>{siteConfig.playerStore.btnRedeemNormal}</span>}
                            </button>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Ang Pao overlay */}
            <AngPaoOverlay
                visible={angPaoVisible}
                pointsReceived={angPaoPoints}
                message={angPaoMessage}
                onClose={() => {
                    setAngPaoVisible(false);
                }}
            />
        </div>
    );
}
