import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const types = await prisma.taskType.findMany({
            orderBy: { createdAt: 'asc' }
        })
        return NextResponse.json(types)
    } catch (error) {
        console.error('[API Error]', error)
        return NextResponse.json({ error: 'Failed to fetch task types' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { name, resetMode } = await req.json()
        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

        const existing = await prisma.taskType.findUnique({ where: { name } })
        if (existing) return NextResponse.json({ error: 'Type already exists' }, { status: 409 })

        const type = await prisma.taskType.create({
            data: { name, resetMode: resetMode || 'NONE' }
        })
        return NextResponse.json(type)
    } catch (error) {
        console.error('[API Error]', error)
        return NextResponse.json({ error: 'Failed to create task type' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        await prisma.taskType.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[API Error]', error)
        return NextResponse.json({ error: 'Failed to delete task type' }, { status: 500 })
    }
}
