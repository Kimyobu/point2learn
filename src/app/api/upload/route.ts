import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file received.' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, '_'); // sanitize
        const filename = `${uniqueSuffix}-${originalName}`;

        // Save to public/uploads directory
        const uploadDir = join(process.cwd(), 'public', 'uploads');

        // Ensure directory exists
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
        console.error('[API Error]', e);
            // Ignore if exists
        }

        const filepath = join(uploadDir, filename);
        await writeFile(filepath, buffer);

        // Return the relative URL string that can be used directly in <img> src
        const fileUrl = `/uploads/${filename}`;

        return NextResponse.json({ url: fileUrl, success: true });
    } catch (error) {
        console.error('[API Error]', error);
        console.error('Upload Error:', error);
        return NextResponse.json({ error: 'Failed to upload file.' }, { status: 500 });
    }
}
