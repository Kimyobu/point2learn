import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        // Expected payload from Google Apps Script:
        // { "score": 8, "totalScore": 10, "formTitle": "สอบวันที่ 3" }
        const { score, totalScore, formTitle } = body

        if (score === undefined || totalScore === undefined) {
            return NextResponse.json({ error: 'Missing score data' }, { status: 400 })
        }

        const percentage = (Number(score) / Number(totalScore)) * 100

        let pointsEarned = 0
        if (percentage === 100) pointsEarned = 20
        else if (percentage >= 80) pointsEarned = 15
        else if (percentage >= 60) pointsEarned = 10

        if (pointsEarned > 0) {
            // Find the player user (assuming only 1 player in this system)
            const player = await prisma.user.findFirst({
                where: { role: 'PLAYER' }
            })

            if (player) {
                await prisma.user.update({
                    where: { id: player.id },
                    data: { points: { increment: pointsEarned } }
                })

                // Log the auto task completion
                await prisma.task.create({
                    data: {
                        title: `[Auto] สอบผ่าน ${formTitle || 'Google Form'} (${percentage.toFixed(0)}%)`,
                        description: `ได้คะแนน ${score}/${totalScore}`,
                        points: pointsEarned,
                        type: 'AUTO',
                        isActive: false // Archiving immediately since it's an auto log
                    }
                })
            }
        }

        return NextResponse.json({ success: true, pointsEarned, percentage })
    } catch (error) {
        console.error('[API Error]', error);
        console.error('Webhook Error:', error)
        return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 })
    }
}
