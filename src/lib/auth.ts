import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

const secretKey = process.env.JWT_SECRET || 'point2learn-secret-key-super-secure'
const key = new TextEncoder().encode(secretKey)

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d') // Token expires in 30 days
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
            // invalid cookie, fall through
        }
    }

    // 2. Fallback: check Authorization header (for iOS PWA where cookies are lost on force close)
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

export async function setSession(userId: string, role: string, username: string) {
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const session = await encrypt({ userId, role, username, expires })

    const cookieStore = await cookies()
    cookieStore.set('session', session, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    })
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
