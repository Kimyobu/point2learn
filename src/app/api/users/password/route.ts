import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { userId, oldPassword, newPassword } = await req.json()

        // Admin changing another user's password
        if (userId && userId !== session.id) {
            if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

            const hashedPassword = await bcrypt.hash(newPassword, 10)
            await prisma.user.update({
                where: { id: userId },
                data: { password: hashedPassword }
            })
            return NextResponse.json({ success: true })
        }

        // User changing their own password
        const user = await prisma.user.findUnique({ where: { id: session.id } })
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const isValid = await bcrypt.compare(oldPassword || '', user.password)
        if (!isValid) return NextResponse.json({ error: 'รหัสผ่านเดิมไม่ถูกต้อง' }, { status: 400 })

        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await prisma.user.update({
            where: { id: session.id },
            data: { password: hashedPassword }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[API Error]', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
