'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getPublicStaffBySlug } from '@/server/public/queries/peoplePublic';

const submitTestimonialSchema = z.object({
  staffSlug: z.string().trim().min(1, 'Staff slug is required.'),
  name: z.string().trim().min(1, 'Name is required.').max(120, 'Name is too long.'),
  relationship: z
    .string()
    .trim()
    .min(1, 'Relationship is required.')
    .max(120, 'Relationship is too long.'),
  tributeHtml: z.string().trim().min(1, 'Tribute is required.'),
});

type SubmitTestimonialInput = z.infer<typeof submitTestimonialSchema>;

export async function submitTestimonial(input: SubmitTestimonialInput) {
  const parsed = submitTestimonialSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid tribute submission.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { staffSlug, name, relationship, tributeHtml } = parsed.data;

  try {
    const staff = await getPublicStaffBySlug(staffSlug);

    if (!staff) {
      return { success: false, error: 'Staff profile not found.' };
    }

    const inMemoriam = staff.isInMemoriam || staff.staffStatus === 'IN_MEMORIAM';
    if (!inMemoriam) {
      return { success: false, error: 'Tributes are only enabled for in-memoriam staff.' };
    }

    await prisma.tributeTestimonial.create({
      data: {
        staffId: staff.id,
        name,
        relationship,
        tributeHtml,
        status: 'PENDING',
      },
      select: { id: true },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to submit tribute testimonial:', error);
    return { success: false, error: 'Failed to submit tribute. Please try again.' };
  }
}
