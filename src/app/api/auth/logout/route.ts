import { NextRequest, NextResponse } from 'next/server'
import { destroySession, getSession, deleteSessionByToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
    // Destroy the cookie
    await destroySession()

    // Also delete the DB session if refreshToken is provided
    try {
        const body = await req.json().catch(() => ({}))
        if (body.refreshToken) {
            await deleteSessionByToken(body.refreshToken)
        }
    } catch (e) {
        // best-effort cleanup
    }

    return NextResponse.json({ success: true, message: 'Logged out successfully' })
}
