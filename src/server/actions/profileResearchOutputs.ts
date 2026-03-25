'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth, requireStaffOwnership } from '@/lib/guards';
import { z } from 'zod';
import { Prisma, ResearchOutputType } from '@prisma/client';
import { deriveAuthorsString } from '@/lib/legacyResearchOutputCompat';
import { FIELD_MAP } from '@/lib/researchOutputFieldMap';
import { buildMetaForType } from '@/lib/researchOutputMeta';

const DOI_REGEX = /^10\.\d{4,9}\/\S+$/i;

/* ── sub-schemas ── */

const authorObjectSchema = z.object({
  staffId: z.string().nullable().optional(),
  given_name: z.string().min(1, 'First name is required.'),
  middle_name: z.string().nullable().optional(),
  family_name: z.string(),
  suffix: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  is_group: z.boolean().nullable().optional(),
});

/* ── main schema ── */

const researchOutputSchema = z
  .object({
    type: z.nativeEnum(ResearchOutputType, { message: 'Invalid output type' }),
    title: z.string().min(1, 'Title is required.'),

    // legacy flat string — kept for backward compat / list display
    authors: z.string().optional().default(''),

    // structured
    authorsJson: z.array(authorObjectSchema).optional().nullable(),
    groupAuthor: z.string().optional().nullable(),

    // date
    year: z.coerce
      .number()
      .int()
      .min(1900, 'Year must be 1900 or later.')
      .max(new Date().getFullYear() + 1, 'Year is too far in the future.')
      .optional()
      .nullable(),
    fullDate: z.string().optional().nullable(), // ISO date string

    // common text
    subtitle: z.string().optional().nullable(),
    sourceTitle: z.string().optional().nullable(),
    publisher: z.string().optional().nullable(),
    doi: z.preprocess((value) => {
      if (typeof value !== 'string') return value;
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    }, z.string().regex(DOI_REGEX, 'Invalid DOI format. Use a DOI like 10.1234/abc123.').optional().nullable()),
    url: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),
    language: z.string().optional().nullable(),
    abstract: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),

    // json
    keywordsJson: z.array(z.string()).optional().nullable(),
    metaJson: z.record(z.string(), z.unknown()).optional().nullable(),

    // kept but unused if empty
    venue: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    /* ── At least one author ── */
    const hasAuthors =
      (data.authorsJson && data.authorsJson.length > 0) ||
      (data.authors && data.authors.trim().length > 0);
    if (!hasAuthors) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one author is required.',
        path: ['authorsJson'],
      });
    }

    /* ── Date/Year Requirement ── */
    if (data.type !== 'DATA') {
      if (!data.year && !data.fullDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Year or full date is required.',
          path: ['year'],
        });
      }
    }

    /* ── Type-specific validation ── */
    const meta = (data.metaJson || {}) as Record<string, unknown>;
    const chk = (val: unknown) => typeof val === 'string' && val.trim().length > 0;

    const mapConfig = FIELD_MAP[data.type];
    if (mapConfig) {
      mapConfig.fields.forEach((field) => {
        // if required, check both metaJson and top-level fields (e.g. publisher)
        if (field.required && !chk(meta[field.key]) && !chk(data[field.key as keyof typeof data])) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${field.label} is required.`,
            path: ['metaJson', field.key],
          });
        }
      });
    }
  });

/* ── Helpers ── */

function buildPersistData(
  validData: z.infer<typeof researchOutputSchema>,
  existingMeta: Record<string, unknown> = {},
) {
  // Derive flat authors string from structured data
  const flatAuthors =
    deriveAuthorsString(validData.authorsJson, validData.groupAuthor) ||
    validData.authors?.trim() ||
    '';

  const rawMeta =
    validData.metaJson && typeof validData.metaJson === 'object'
      ? (validData.metaJson as Record<string, unknown>)
      : {};
  const cleanedMeta = buildMetaForType(validData.type, rawMeta, existingMeta);

  return {
    type: validData.type,
    title: validData.title.trim(),
    authors: flatAuthors,
    year:
      validData.year ?? (validData.fullDate ? new Date(validData.fullDate).getFullYear() : null),
    venue: validData.venue?.trim() || null,
    url: validData.url?.trim() || null,
    doi: validData.doi ?? null,
    groupAuthor: validData.groupAuthor?.trim() || null,
    fullDate: validData.fullDate ? new Date(validData.fullDate) : null,
    subtitle: validData.subtitle?.trim() || null,
    sourceTitle: validData.sourceTitle?.trim() || null,
    publisher: validData.publisher?.trim() || null,
    language: validData.language?.trim() || null,
    abstract: validData.abstract?.trim() || null,
    notes: validData.notes?.trim() || null,
    authorsJson: (validData.authorsJson || undefined) as Prisma.InputJsonValue | undefined,
    keywordsJson: (validData.keywordsJson || undefined) as Prisma.InputJsonValue | undefined,
    metaJson:
      Object.keys(cleanedMeta).length > 0 ? (cleanedMeta as Prisma.InputJsonValue) : Prisma.DbNull,
  };
}

/* ── Actions ── */

export async function createMyResearchOutput(data: z.infer<typeof researchOutputSchema>) {
  try {
    const session = await requireAuth();
    const staffId = session.user?.staffId;
    if (!staffId) return { error: 'No associated staff record found.' };

    requireStaffOwnership(session, staffId);

    const parsed = researchOutputSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const created = await prisma.researchOutput.create({
      data: {
        staffId,
        ...buildPersistData(parsed.data),
      },
      select: { id: true },
    });

    revalidatePath('/dashboard/profile/research-outputs');
    revalidatePath(`/dashboard/profile/research-outputs/${created.id}`);
    return { success: true };
  } catch (error) {
    console.error('Create Research Output Error:', error);
    return { error: 'Failed to create research output.' };
  }
}

export async function updateMyResearchOutput(
  id: string,
  data: z.infer<typeof researchOutputSchema>,
) {
  try {
    const session = await requireAuth();
    const staffId = session.user?.staffId;
    if (!staffId) return { error: 'No associated staff record found.' };

    requireStaffOwnership(session, staffId);

    const existing = await prisma.researchOutput.findUnique({
      where: { id },
      select: { staffId: true, metaJson: true },
    });

    if (!existing || existing.staffId !== staffId) {
      return { error: 'Record not found or access denied.' };
    }

    const parsed = researchOutputSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    // Merge metaJson: preserve unknown keys from existing record
    const existingMeta =
      existing.metaJson &&
      typeof existing.metaJson === 'object' &&
      !Array.isArray(existing.metaJson)
        ? (existing.metaJson as Record<string, unknown>)
        : {};

    const persistData = buildPersistData(parsed.data, existingMeta);

    await prisma.researchOutput.update({
      where: { id },
      data: persistData,
    });

    revalidatePath('/dashboard/profile/research-outputs');
    revalidatePath(`/dashboard/profile/research-outputs/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Update Research Output Error:', error);
    return { error: 'Failed to update research output.' };
  }
}

export async function deleteMyResearchOutput(id: string) {
  try {
    const session = await requireAuth();
    const staffId = session.user?.staffId;
    if (!staffId) return { error: 'No associated staff record found.' };

    requireStaffOwnership(session, staffId);

    const existing = await prisma.researchOutput.findUnique({
      where: { id },
      select: { staffId: true },
    });

    if (!existing || existing.staffId !== staffId) {
      return { error: 'Record not found or access denied.' };
    }

    await prisma.researchOutput.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    revalidatePath('/dashboard/profile/research-outputs');
    return { success: true };
  } catch (error) {
    console.error('Delete Research Output Error:', error);
    return { error: 'Failed to delete research output.' };
  }
}
