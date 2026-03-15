import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    return new PrismaClient()
}

declare global {
    var prismaGlobalNew: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobalNew ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobalNew = prisma
