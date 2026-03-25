import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/guards';
import { isResearchLeadForGroup, isSuperAdmin } from '@/lib/rbac';
import { validateImageUpload } from '@/lib/security/imageUpload';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const groupIdRaw = formData.get('groupId');
    const groupId = typeof groupIdRaw === 'string' && groupIdRaw.trim() ? groupIdRaw.trim() : null;

    if (!file) {
      return NextResponse.json({ ok: false, error: 'No file uploaded.' }, { status: 400 });
    }

    const validated = await validateImageUpload(file, { maxSizeBytes: MAX_SIZE });
    if (!validated.ok) {
      return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
    }

    const canBypass = isSuperAdmin(session);
    if (!canBypass) {
      if (!groupId) {
        return NextResponse.json(
          { ok: false, error: 'Only Super Admin can upload before group creation.' },
          { status: 403 },
        );
      }

      const isLead = await isResearchLeadForGroup(session, groupId);
      if (!isLead) {
        return NextResponse.json(
          { ok: false, error: 'Not authorized to upload for this research group.' },
          { status: 403 },
        );
      }
    }

    const safeGroupId = (groupId || 'new').replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `${safeGroupId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${validated.format.ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'research-groups');
    await mkdir(uploadDir, { recursive: true });

    await writeFile(path.join(uploadDir, filename), validated.buffer);

    return NextResponse.json({ ok: true, url: `/uploads/research-groups/${filename}` });
  } catch (error) {
    console.error('Research group hero upload error:', error);
    return NextResponse.json({ ok: false, error: 'Upload failed.' }, { status: 500 });
  }
}
