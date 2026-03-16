import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        let logs;
        if (session.role === 'ADMIN') {
            logs = await prisma.redeemLog.findMany({
                include: { user: { select: { username: true, displayName: true } } },
                orderBy: { createdAt: 'desc' }
            })
        } else {
            logs = await prisma.redeemLog.findMany({
                where: { userId: session.userId },
                orderBy: { createdAt: 'desc' }
            })
        }
        return NextResponse.json(logs)
    } catch (error) {
        console.error('[API Error]', error)
        return NextResponse.json({ error: 'Failed to fetch redeem logs' }, { status: 500 })
    }
}
