import { NextRequest, NextResponse } from 'next/server'
import { rotateRefreshToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const { refreshToken } = await req.json()

        if (!refreshToken) {
            return NextResponse.json({ error: 'Refresh token required' }, { status: 400 })
        }

        const result = await rotateRefreshToken(refreshToken)

        if (!result) {
            return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 })
        }

        return NextResponse.json({
            success: true,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user,
        })
    } catch (error) {
        console.error('[API Error] refresh:', error)
        return NextResponse.json({ error: 'Failed to refresh session' }, { status: 500 })
    }
}
