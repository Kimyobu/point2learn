import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        await prisma.message.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[API Error]', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
