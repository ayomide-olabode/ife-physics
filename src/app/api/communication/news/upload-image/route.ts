import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { validateImageUpload } from '@/lib/security/imageUpload';
import { ScopedRole } from '.prisma/client';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: Request) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: 'No file provided.' }, { status: 400 });
    }

    const validated = await validateImageUpload(file, { maxSizeBytes: MAX_SIZE });
    if (!validated.ok) {
      return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
    }

    const ext = validated.format.ext;
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'news');
    await mkdir(uploadDir, { recursive: true });

    await writeFile(join(uploadDir, filename), validated.buffer);

    const url = `/uploads/news/${filename}`;
    return NextResponse.json({ ok: true, url });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ ok: false, error: 'Upload failed.' }, { status: 500 });
  }
}
