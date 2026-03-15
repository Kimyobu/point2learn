import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const model = searchParams.get('model');

    try {
        let data: any[] = [];
        if (model === 'users') {
            data = await prisma.user.findMany({ select: { id: true, username: true, displayName: true, role: true, points: true, totalPointsEarned: true } });
        } else if (model === 'tasks') {
            data = await prisma.task.findMany();
        } else if (model === 'rewards') {
            data = await prisma.reward.findMany();
        } else if (model === 'submissions') {
            data = await prisma.submission.findMany();
        } else {
            return NextResponse.json({ error: 'Unknown model' }, { status: 400 });
        }
        return NextResponse.json({ data });
    } catch (e) {
        console.error('[API Error]', e);
        return NextResponse.json({ error: 'Database read failed' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { model, id, data } = await req.json();

        let updatedData;
        if (model === 'users') {
            updatedData = await prisma.user.update({ where: { id }, data });
        } else if (model === 'tasks') {
            updatedData = await prisma.task.update({ where: { id }, data });
        } else if (model === 'rewards') {
            updatedData = await prisma.reward.update({ where: { id }, data });
        } else if (model === 'submissions') {
            updatedData = await prisma.submission.update({ where: { id }, data });
        } else {
            return NextResponse.json({ error: 'Unknown model' }, { status: 400 });
        }

        return NextResponse.json({ success: true, data: updatedData });
    } catch (e) {
        console.error('[API Error]', e);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { model, id } = await req.json();

        if (model === 'users') await prisma.user.delete({ where: { id } });
        else if (model === 'tasks') await prisma.task.delete({ where: { id } });
        else if (model === 'rewards') await prisma.reward.delete({ where: { id } });
        else if (model === 'submissions') await prisma.submission.delete({ where: { id } });
        else return NextResponse.json({ error: 'Unknown model' }, { status: 400 });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('[API Error]', e);
        return NextResponse.json({ error: 'Database delete failed' }, { status: 500 });
    }
}
