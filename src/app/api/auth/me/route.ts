import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ isAuthenticated: false }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { id: true, username: true, role: true, points: true, avatarUrl: true, avatarBg: true, themeColor: true, displayName: true, title: true, totalPointsEarned: true }
        })

        if (!user) {
            return NextResponse.json({ isAuthenticated: false }, { status: 401 })
        }

        return NextResponse.json({ isAuthenticated: true, user })
    } catch (err: any) {
        console.error('[API Error]', err);
        console.error("GET /api/auth/me Error:", err);
        return NextResponse.json({ isAuthenticated: false, error: 'Failed to authenticate', details: err.message }, { status: 500 })
    }
}
