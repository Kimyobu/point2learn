import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const messages = await prisma.message.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(messages)
    } catch (error) {
        console.error('[API Error]', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { content } = await req.json()
        const message = await prisma.message.create({ data: { content } })

        return NextResponse.json(message)
    } catch (error) {
        console.error('[API Error]', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
