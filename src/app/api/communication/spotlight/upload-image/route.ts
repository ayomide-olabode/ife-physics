import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { validateImageUpload } from '@/lib/security/imageUpload';
import { ScopedRole } from '.prisma/client';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, ScopedRole.EDITOR);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const validated = await validateImageUpload(file, { maxSizeBytes: 2 * 1024 * 1024 });
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public/uploads/spotlight');
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = validated.format.ext;
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    await fs.writeFile(filePath, validated.buffer);

    const fileUrl = `/uploads/spotlight/${filename}`;

    return NextResponse.json({ ok: true, url: fileUrl });
  } catch (err: unknown) {
    console.error('Spotlight image upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
