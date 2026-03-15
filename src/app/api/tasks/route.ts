import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const tasks = await prisma.task.findMany({
            orderBy: { createdAt: 'desc' },
            where: session.role === 'PLAYER' ? { isActive: true } : undefined
        })

        return NextResponse.json(tasks)
    } catch (error) {
        console.error('[API Error]', error);
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { title, description, points, type, isGoogleForm } = await req.json()

        if (!title || typeof points !== 'number') {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                points,
                type: type || 'DAILY',
                isGoogleForm: !!isGoogleForm
            }
        })

        return NextResponse.json(task)
    } catch (error) {
        console.error('[API Error]', error);
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }
}
