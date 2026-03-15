import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const playerPassword = await bcrypt.hash('love123', 10);

    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: adminPassword,
            role: 'ADMIN',
        },
    });

    const player = await prisma.user.upsert({
        where: { username: 'player' },
        update: {},
        create: {
            username: 'player',
            password: playerPassword,
            role: 'PLAYER',
        },
    });

    console.log('Seed completed successfully:');
    console.log({ admin: admin.username, player: player.username });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
