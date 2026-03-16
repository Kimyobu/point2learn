import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { comparePassword, setSession } from '@/lib/auth'

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

        await setSession(user.id, user.role, user.username)

        // Also return token for localStorage persistence (iOS PWA)
        const { encrypt } = await import('@/lib/auth')
        const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        const token = await encrypt({ userId: user.id, role: user.role, username: user.username, expires })

        return NextResponse.json({
            success: true,
            token,
            user: { id: user.id, username: user.username, role: user.role, points: user.points }
        })
    } catch (error) {
        console.error('[API Error]', error);
        console.error('Login error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
