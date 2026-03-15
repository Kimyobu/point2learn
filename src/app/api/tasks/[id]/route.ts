import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await req.json()
        const { title, description, points, type, isActive } = body

        const task = await prisma.task.update({
            where: { id },
            data: {
                title,
                description,
                points: points ? parseInt(points) : undefined,
                type,
                isActive
            }
        })

        return NextResponse.json(task)
    } catch (error) {
        console.error('[API Error]', error);
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Delete all submissions associated with the task first to prevent Foreign Key constraint error (P2003)
        await prisma.submission.deleteMany({
            where: { taskId: id }
        })

        await prisma.task.delete({
            where: { id }
        })

        return NextResponse.json({ success: true, message: 'Task deleted successfully' })
    } catch (error) {
        console.error('[API Error]', error);
        return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
    }
}
