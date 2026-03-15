import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        let submissions;
        if (session.role === 'ADMIN') {
            submissions = await prisma.submission.findMany({
                include: { user: true, task: true },
                orderBy: { createdAt: 'desc' }
            })
        } else {
            submissions = await prisma.submission.findMany({
                where: { userId: session.userId },
                include: { task: true },
                orderBy: { createdAt: 'desc' }
            })
        }
        return NextResponse.json(submissions)
    } catch (error) {
        console.error('[API Error]', error);
        return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'PLAYER') {
            return NextResponse.json({ error: 'Unauthorized. Only players can submit.' }, { status: 401 })
        }

        const formData = await req.formData()
        const taskId = formData.get('taskId') as string
        const file = formData.get('image') as File | null

        if (!taskId) {
            return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
        }

        let imageUrl = null

        if (file) {
            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)

            const uploadDir = join(process.cwd(), 'public/uploads')
            if (!existsSync(uploadDir)) {
                await mkdir(uploadDir, { recursive: true })
            }

            const filename = `${Date.now()}-${file.name.replace(/\\s/g, '_')}`
            const filepath = join(uploadDir, filename)
            await writeFile(filepath, buffer)
            imageUrl = `/uploads/${filename}`
        }

        const submission = await prisma.submission.create({
            data: {
                userId: session.userId,
                taskId,
                imageUrl,
                status: 'PENDING'
            }
        })

        return NextResponse.json(submission)
    } catch (error) {
        console.error('[API Error]', error);
        console.error('Submission error:', error)
        return NextResponse.json({ error: 'Failed to submit task' }, { status: 500 })
    }
}
