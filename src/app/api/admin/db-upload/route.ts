import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        if (!file.name.endsWith('.db')) {
            return NextResponse.json({ error: 'Invalid file type, must be .db' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // We check the environment variable where Railway mounts the database
        // and override dev.db. If not set, we default to local dev.db
        let dbPath = process.env.DATABASE_URL?.replace('file:', '') || './dev.db';

        // Check if dbPath is absolute or relative
        if (!path.isAbsolute(dbPath)) {
            dbPath = path.join(process.cwd(), dbPath);
        }

        // Backup existing database just in case
        if (fs.existsSync(dbPath)) {
            fs.copyFileSync(dbPath, `${dbPath}.backup-${Date.now()}`);
        }

        // Write the new db file over the old one
        fs.writeFileSync(dbPath, buffer);

        return NextResponse.json({ success: true, message: 'Database replaced successfully. The app might need to restart to establish new connections.' });

    } catch (error) {
        console.error('Error uploading DB:', error);
        return NextResponse.json({ error: 'Internal server error while uploading DB' }, { status: 500 });
    }
}
