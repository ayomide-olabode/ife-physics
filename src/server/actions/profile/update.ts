'use server';

import { getStaffRankValuesByType, STAFF_TITLE_OPTIONS } from '@/lib/options';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/guards';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

function normalizeRichText(value?: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const textOnly = trimmed
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return textOnly ? trimmed : null;
}

const updateProfileSchema = z.object({
  title: z
    .string()
    .optional()
    .refine(
      (value) =>
        !value || STAFF_TITLE_OPTIONS.includes(value as (typeof STAFF_TITLE_OPTIONS)[number]),
      {
        message: 'Please select a valid title.',
      },
    ),
  firstName: z.string().min(1, 'First name is strictly required.'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is strictly required.'),
  academicRank: z.string().max(120, 'Staff rank must be 120 characters or fewer.').optional(),
  designation: z.string().max(200, 'Designation must be 200 characters or fewer.').optional(),
  roomNumber: z.string().max(50, 'Office room number must be 50 characters or fewer.').optional(),
  bio: z.string().max(10000, 'Bio must be 10,000 characters or fewer.').optional(),
  education: z.string().max(10000, 'Education must be 10,000 characters or fewer.').optional(),
  researchInterests: z
    .string()
    .max(10000, 'Research interests must be 10,000 characters or fewer.')
    .optional(),
  membershipOfProfessionalOrganizations: z
    .string()
    .max(10000, 'Membership of professional organizations must be 10,000 characters or fewer.')
    .optional(),
});

export async function updateStaffProfile(data: {
  title?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  academicRank?: string;
  designation?: string;
  roomNumber?: string;
  bio?: string;
  education?: string;
  researchInterests?: string;
  membershipOfProfessionalOrganizations?: string;
}) {
  try {
    const session = await requireAuth();
    const staffId = session.user?.staffId;

    if (!staffId) {
      return { error: 'No associated staff record found for your account.' };
    }

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { staffType: true },
    });

    if (!staff) {
      return { error: 'No associated staff record found for your account.' };
    }

    const parsed = updateProfileSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const {
      title,
      firstName,
      middleName,
      lastName,
      academicRank,
      designation,
      roomNumber,
      bio,
      education,
      researchInterests,
      membershipOfProfessionalOrganizations,
    } = parsed.data;
    const normalizedStaffRank = academicRank?.trim() ?? '';
    const normalizedTitle = title?.trim() ?? '';
    const allowedStaffRanks = getStaffRankValuesByType(staff.staffType);

    if (normalizedStaffRank && !allowedStaffRanks.includes(normalizedStaffRank)) {
      return { error: 'Please select a valid staff rank for your staff type.' };
    }

    await prisma.staff.update({
      where: { id: staffId },
      data: {
        title: normalizedTitle || null,
        firstName: firstName.trim(),
        middleName: middleName?.trim() ? middleName.trim() : null,
        lastName: lastName.trim(),
        academicRank: normalizedStaffRank || null,
        designation: designation?.trim() ? designation.trim() : null,
        roomNumber: roomNumber?.trim() ? roomNumber.trim() : null,
        bio: normalizeRichText(bio),
        education: normalizeRichText(education),
        researchInterests: normalizeRichText(researchInterests),
        membershipOfProfessionalOrganizations: normalizeRichText(
          membershipOfProfessionalOrganizations,
        ),
      },
    });

    revalidatePath('/dashboard/profile/overview');
    revalidatePath('/dashboard/admin/staff');
    revalidatePath('/people');

    return { success: true };
  } catch (error) {
    console.error('Update Profile Error:', error);
    return { error: 'Failed to update profile.' };
  }
}
