import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const rewards = await prisma.reward.findMany({
            orderBy: { pointsCost: 'asc' },
            where: { isAvailable: true }
        })
        return NextResponse.json(rewards)
    } catch (error) {
        console.error('[API Error]', error);
        return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { name, description, pointsCost, imageUrl } = body

        const reward = await prisma.reward.create({
            data: {
                name,
                description,
                pointsCost: parseInt(pointsCost),
                imageUrl,
                isAvailable: true
            }
        })

        return NextResponse.json(reward)
    } catch (error) {
        console.error('[API Error]', error);
        return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 })
    }
}
