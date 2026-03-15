import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const playerPassword = await bcrypt.hash('love123', 10);

    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount === 0) {
        await prisma.user.create({
            data: {
                username: 'admin',
                password: adminPassword,
                role: 'ADMIN',
            },
        });
        console.log('Created default ADMIN account');
    } else {
        console.log(`ADMIN account already exists (${adminCount} found)`);
    }

    const playerCount = await prisma.user.count({ where: { role: 'PLAYER' } });
    if (playerCount === 0) {
        await prisma.user.create({
            data: {
                username: 'player',
                password: playerPassword,
                role: 'PLAYER',
            },
        });
        console.log('Created default PLAYER account');
    } else {
        console.log(`PLAYER account already exists (${playerCount} found)`);
    }

    console.log('Seed check completed successfully.');
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
