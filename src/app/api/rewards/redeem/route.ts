import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'PLAYER') {
            return NextResponse.json({ error: 'Unauthorized. Only players can redeem.' }, { status: 401 })
        }

        const { rewardId } = await req.json()

        if (!rewardId) {
            return NextResponse.json({ error: 'Reward ID is required' }, { status: 400 })
        }

        const result = await prisma.$transaction(async (tx: any) => {
            const reward = await tx.reward.findUnique({ where: { id: rewardId } })
            if (!reward || !reward.isAvailable) {
                throw new Error('Reward not found or unavailable')
            }

            const user = await tx.user.findUnique({ where: { id: session.userId } })
            if (!user) {
                throw new Error('User not found')
            }

            if (user.points < reward.pointsCost) {
                throw new Error('Not enough points')
            }

            // Deduct points
            const updatedUser = await tx.user.update({
                where: { id: user.id },
                data: {
                    points: { decrement: reward.pointsCost }
                }
            })

            // Log the redeem
            const isGacha = reward.name.includes('สุ่ม') || reward.name.toLowerCase().includes('gacha') || reward.name.includes('กล่อง');
            await tx.redeemLog.create({
                data: {
                    userId: user.id,
                    rewardId: reward.id,
                    rewardName: reward.name,
                    pointsSpent: reward.pointsCost,
                    isGacha,
                }
            })

            return { user: updatedUser, reward }
        })

        return NextResponse.json({
            success: true,
            message: `Successfully redeemed ${result.reward.name}!`,
            pointsRemaining: result.user.points
        })
    } catch (error: any) {
        console.error('[API Error]', error);
        return NextResponse.json({ error: error.message || 'Failed to redeem reward' }, { status: 400 })
    }
}
