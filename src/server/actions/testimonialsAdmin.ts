'use server';

import { requireTributesAccess } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const testimonialIdSchema = z.object({
  id: z.string().min(1, 'Testimonial ID is required.'),
});

const declineSchema = z.object({
  id: z.string().min(1, 'Testimonial ID is required.'),
  reason: z.string().trim().max(500, 'Decline reason cannot exceed 500 characters.').optional(),
});

export async function approveTestimonial(id: string) {
  const session = await requireTributesAccess();
  const parsed = testimonialIdSchema.safeParse({ id });
  if (!parsed.success) {
    return { success: false, error: 'Invalid testimonial ID.' };
  }

  try {
    const testimonial = await prisma.tributeTestimonial.update({
      where: { id: parsed.data.id },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewerUserId: session.user.userId ?? null,
        declineReason: null,
      },
      select: { id: true, staffId: true, status: true },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'TRIBUTE_TESTIMONIAL_APPROVED',
      entityType: 'TributeTestimonial',
      entityId: testimonial.id,
      snapshot: { staffId: testimonial.staffId, status: testimonial.status },
    });

    revalidatePath('/dashboard/content/tributes');
    revalidatePath(`/dashboard/content/tributes/${testimonial.staffId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to approve testimonial:', error);
    return { success: false, error: 'Failed to approve testimonial.' };
  }
}

export async function declineTestimonial(id: string, reason?: string) {
  const session = await requireTributesAccess();
  const parsed = declineSchema.safeParse({ id, reason });
  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid decline data.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const testimonial = await prisma.tributeTestimonial.update({
      where: { id: parsed.data.id },
      data: {
        status: 'DECLINED',
        reviewedAt: new Date(),
        reviewerUserId: session.user.userId ?? null,
        declineReason: parsed.data.reason?.trim() || null,
      },
      select: { id: true, staffId: true, status: true, declineReason: true },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'TRIBUTE_TESTIMONIAL_DECLINED',
      entityType: 'TributeTestimonial',
      entityId: testimonial.id,
      snapshot: {
        staffId: testimonial.staffId,
        status: testimonial.status,
        declineReason: testimonial.declineReason,
      },
    });

    revalidatePath('/dashboard/content/tributes');
    revalidatePath(`/dashboard/content/tributes/${testimonial.staffId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to decline testimonial:', error);
    return { success: false, error: 'Failed to decline testimonial.' };
  }
}
