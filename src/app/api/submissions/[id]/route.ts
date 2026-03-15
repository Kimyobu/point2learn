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
        const { status } = await req.json() // "APPROVED" or "REJECTED"

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        // Get the submission and task details
        const submission = await prisma.submission.findUnique({
            where: { id },
            include: { task: true, user: true }
        })

        if (!submission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
        }

        if (submission.status !== 'PENDING') {
            return NextResponse.json({ error: 'Submission is already processed' }, { status: 400 })
        }

        // Update submission status
        const updatedSubmission = await prisma.submission.update({
            where: { id },
            data: { status }
        })

        // If approved, give points to user
        if (status === 'APPROVED') {
            await prisma.user.update({
                where: { id: submission.userId },
                data: {
                    points: {
                        increment: submission.task.points
                    }
                }
            })
        }

        return NextResponse.json(updatedSubmission)
    } catch (error) {
        console.error('[API Error]', error);
        return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
    }
}
