import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { join, normalize, resolve, basename } from 'path';
import { getSession } from '@/lib/auth';

// Detect the root storage path safely
const getStorageRoot = () => {
    if (process.env.STORAGE_PATH) return process.env.STORAGE_PATH;
    if (process.env.UPLOAD_PATH) {
        // If UPLOAD_PATH is set directly, we assume that IS the root for admin files
        // but we'll trim the /uploads part if needed to manage the parent folder
        return process.env.UPLOAD_PATH.replace(/\/uploads\/?$/, '');
    }

    // local fallback
    const localDir = join(process.cwd(), 'storage');
    // We do NOT create the root directory lazily here anymore on top level, handled per-route
    return localDir;
};

// Security check to prevent traversing outside storage root
const getSafePath = (targetPath: string) => {
    const root = resolve(getStorageRoot());
    const target = resolve(join(root, targetPath));
    if (!target.startsWith(root)) {
        throw new Error('Invalid path traversal detected');
    }
    return target;
};

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const folderPath = searchParams.get('path') || '';
        const download = searchParams.get('download');

        const safePath = getSafePath(folderPath);

        // Download file mode
        if (download && fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
            const fileBuffer = fs.readFileSync(safePath);
            return new NextResponse(fileBuffer, {
                headers: {
                    'Content-Disposition': `attachment; filename="${basename(safePath)}"`,
                    'Content-Type': 'application/octet-stream'
                }
            });
        }

        // List directory mode
        if (!fs.existsSync(safePath)) {
            return NextResponse.json({ error: 'Directory not found' }, { status: 404 });
        }

        const items = fs.readdirSync(safePath, { withFileTypes: true });
        const list = items.map(item => {
            const itemPath = join(safePath, item.name);
            const stats = fs.statSync(itemPath);
            return {
                name: item.name,
                isDirectory: item.isDirectory(),
                size: stats.size,
                createdAt: stats.birthtime,
                updatedAt: stats.mtime
            };
        }).sort((a, b) => {
            if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
            return a.isDirectory ? -1 : 1;
        });

        return NextResponse.json({
            currentPath: folderPath,
            root: getStorageRoot(),
            items: list
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const formData = await req.formData();
        const action = formData.get('action');

        if (action === 'upload') {
            const file = formData.get('file') as File;
            const targetPath = formData.get('path') as string || '';

            if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

            const safePath = getSafePath(targetPath);
            if (!fs.existsSync(safePath)) fs.mkdirSync(safePath, { recursive: true });

            const finalPath = join(safePath, file.name);
            const buffer = Buffer.from(await file.arrayBuffer());
            fs.writeFileSync(finalPath, buffer);

            return NextResponse.json({ success: true, message: 'Upload success' });
        }

        if (action === 'mkdir') {
            const folderName = formData.get('folderName') as string;
            const targetPath = formData.get('path') as string || '';
            const safePath = getSafePath(join(targetPath, folderName));

            if (!fs.existsSync(safePath)) fs.mkdirSync(safePath, { recursive: true });
            return NextResponse.json({ success: true, message: 'Folder created' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const targetPath = searchParams.get('path') || '';

        if (!targetPath) return NextResponse.json({ error: 'No path provided' }, { status: 400 });

        const safePath = getSafePath(targetPath);

        if (!fs.existsSync(safePath)) {
            return NextResponse.json({ error: 'File/Folder not found' }, { status: 404 });
        }

        const stats = fs.statSync(safePath);
        if (stats.isDirectory()) {
            fs.rmSync(safePath, { recursive: true, force: true });
        } else {
            fs.unlinkSync(safePath);
        }

        return NextResponse.json({ success: true, message: 'Deleted successfully' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
