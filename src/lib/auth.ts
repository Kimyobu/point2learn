import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import prisma from '@/lib/prisma'

const secretKey = process.env.JWT_SECRET || 'point2learn-secret-key-super-secure'
const key = new TextEncoder().encode(secretKey)

// Access token: short-lived (1 hour)
const ACCESS_TOKEN_EXPIRY = '1h'
// Refresh token: long-lived (90 days)
const REFRESH_TOKEN_DAYS = 90

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(ACCESS_TOKEN_EXPIRY)
        .sign(key)
}

export async function decrypt(input: string): Promise<any> {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ['HS256'],
    })
    return payload
}

export async function hashPassword(password: string) {
    return await bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash)
}

export async function getSession() {
    // 1. Try cookie first
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    if (sessionToken) {
        try {
            return await decrypt(sessionToken)
        } catch (err) {
            // invalid or expired cookie, fall through
        }
    }

    // 2. Fallback: check Authorization header
    try {
        const { headers } = await import('next/headers')
        const headersList = await headers()
        const authHeader = headersList.get('authorization')
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.slice(7)
            return await decrypt(token)
        }
    } catch (err) {
        // headers not available or invalid token
    }

    return null
}

export async function setSessionCookie(accessToken: string) {
    const cookieStore = await cookies()
    cookieStore.set('session', accessToken, {
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour (match JWT)
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    })
}

/**
 * Create access token + refresh token + DB Session row
 */
export async function createFullSession(userId: string, role: string, username: string, deviceInfo?: string) {
    // Create short-lived access token (JWT)
    const accessToken = await encrypt({ userId, role, username })

    // Create long-lived refresh token (opaque UUID, stored in DB)
    const refreshToken = randomUUID()
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000)

    // Store in DB
    await prisma.session.create({
        data: {
            userId,
            refreshToken,
            deviceInfo: deviceInfo || null,
            expiresAt,
        }
    })

    // Set cookie
    await setSessionCookie(accessToken)

    return { accessToken, refreshToken }
}

/**
 * Rotate refresh token: validate old token, issue new pair
 */
export async function rotateRefreshToken(oldRefreshToken: string) {
    // Find existing session
    const session = await prisma.session.findUnique({
        where: { refreshToken: oldRefreshToken },
        include: { user: true }
    })

    if (!session) return null
    if (session.expiresAt < new Date()) {
        // Expired — delete and reject
        await prisma.session.delete({ where: { id: session.id } })
        return null
    }

    // Issue new tokens
    const newRefreshToken = randomUUID()
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000)
    const accessToken = await encrypt({
        userId: session.userId,
        role: session.user.role,
        username: session.user.username
    })

    // Rotate: update the session row with new token
    await prisma.session.update({
        where: { id: session.id },
        data: {
            refreshToken: newRefreshToken,
            expiresAt: newExpiresAt,
        }
    })

    // Set cookie
    await setSessionCookie(accessToken)

    return {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
            id: session.user.id,
            username: session.user.username,
            role: session.user.role,
            points: session.user.points,
        }
    }
}

/**
 * Delete session(s) by refresh token or userId
 */
export async function deleteSessionByToken(refreshToken: string) {
    try {
        await prisma.session.delete({ where: { refreshToken } })
    } catch (e) {
        // session may already be deleted
    }
}

export async function deleteAllUserSessions(userId: string) {
    await prisma.session.deleteMany({ where: { userId } })
}

export async function destroySession() {
    const cookieStore = await cookies()
    cookieStore.set('session', '', {
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    })
}
