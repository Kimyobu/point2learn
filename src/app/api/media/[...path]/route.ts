import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFile } from 'fs/promises';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    try {
        const { path } = await params;
        const filename = path.join('/');

        const getStorageRoot = () => {
            if (process.env.STORAGE_PATH) return process.env.STORAGE_PATH;
            if (process.env.UPLOAD_PATH) {
                return process.env.UPLOAD_PATH.replace(/\/uploads\/?$/, '');
            }
            const localDir = join(process.cwd(), 'storage');
            return localDir;
        };

        const storageRoot = getStorageRoot();
        const uploadDir = join(storageRoot, 'uploads');
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
        console.error(e)
        return new NextResponse('File not found', { status: 404 });
    }
}
