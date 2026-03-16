import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { comparePassword, createFullSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json()

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { username }
        })

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        const isPasswordValid = await comparePassword(password, user.password)

        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // Get device info from User-Agent
        const userAgent = req.headers.get('user-agent') || undefined

        // Clear any existing session cookie before issuing new ones
        const { destroySession } = await import('@/lib/auth')
        await destroySession()

        // Create full session: access token (JWT 1h) + refresh token (DB, 90d)
        const { accessToken, refreshToken } = await createFullSession(
            user.id, user.role, user.username, userAgent
        )

        return NextResponse.json({
            success: true,
            accessToken,
            refreshToken,
            user: { id: user.id, username: user.username, role: user.role, points: user.points }
        })
    } catch (error) {
        console.error('[API Error] login:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
