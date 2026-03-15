import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFile } from 'fs/promises';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    try {
        const { path } = await params;
        const filename = path.join('/');

        const uploadDir = process.env.UPLOAD_PATH || join(process.cwd(), 'public', 'uploads');
        const filepath = join(uploadDir, filename);

        const file = await readFile(filepath);

        let contentType = 'application/octet-stream';
        if (filename.endsWith('.png')) contentType = 'image/png';
        else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) contentType = 'image/jpeg';
        else if (filename.endsWith('.gif')) contentType = 'image/gif';
        else if (filename.endsWith('.webp')) contentType = 'image/webp';
        else if (filename.endsWith('.pdf')) contentType = 'application/pdf';

        return new NextResponse(file, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        });
    } catch (e) {
        return new NextResponse('File not found', { status: 404 });
    }
}
