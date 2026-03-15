import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const users = await prisma.user.findMany({
        select: { id: true, username: true, role: true, points: true, totalPointsEarned: true }
    })
    return NextResponse.json(users)
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const data = await req.json()
        const { avatarUrl, themeColor, displayName, username, avatarBg } = data

        // Prevent taking an existing username
        if (username && username !== session.username) {
            const existing = await prisma.user.findUnique({ where: { username } });
            if (existing) return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
        }

        const updateData: any = {};
        if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
        if (themeColor !== undefined) updateData.themeColor = themeColor;
        if (displayName !== undefined) updateData.displayName = displayName;
        if (username !== undefined) updateData.username = username;
        if (avatarBg !== undefined) updateData.avatarBg = avatarBg;

        const user = await prisma.user.update({
            where: { id: session.userId },
            data: updateData
        });

        return NextResponse.json(user);
    } catch (err: any) {
        console.error('[API Error]', err);
        console.error("PUT /api/users Error:", err);
        return NextResponse.json({ error: 'Failed to update user', details: err.message }, { status: 500 });
    }
}
