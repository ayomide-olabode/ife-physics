'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/guards';
import {
  findBestCandidate,
  normalize,
  parseAuthorName,
  type StaffNameCandidate,
} from '@/lib/nameMatch';

const inputSchema = z.object({
  authors: z.array(
    z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      fullName: z.string().optional(),
    }),
  ),
});

const LINK_THRESHOLD = 95;
const MARGIN_THRESHOLD = 10;

export async function linkAuthorsToStaff(input: z.infer<typeof inputSchema>) {
  const session = await requireAuth();
  if (!session.user?.staffId) {
    return [];
  }

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success || parsed.data.authors.length === 0) {
    return [];
  }

  const parsedAuthors = parsed.data.authors.map((author) => parseAuthorName(author));

  const queryLastNames = Array.from(
    new Set(
      parsedAuthors
        .map((author) => author.lastName.trim())
        .filter((lastName) => lastName.length > 0),
    ),
  );

  if (queryLastNames.length === 0) {
    return parsedAuthors.map(() => ({ staffId: null }));
  }

  const whereLastName = queryLastNames.map((lastName) => ({
    lastName: { equals: lastName},
  }));

  const staffCandidates: StaffNameCandidate[] = await prisma.staff.findMany({
    where: {
      deletedAt: null,
      OR: whereLastName,
    },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }, { id: 'asc' }],
  });

  const usedStaffIds = new Set<string>();

  return parsedAuthors.map((author) => {
    if (!author.normalizedLastName) {
      return { staffId: null };
    }

    const candidatesForLastName = staffCandidates.filter(
      (candidate) => normalize(candidate.lastName || '') === author.normalizedLastName,
    );

    if (candidatesForLastName.length === 0) {
      return { staffId: null };
    }

    const { best, bestScore, secondScore } = findBestCandidate(candidatesForLastName, author);
    if (!best) {
      return { staffId: null };
    }

    const loggedInCandidate = session.user.staffId
      ? candidatesForLastName.find((candidate) => candidate.id === session.user.staffId) || null
      : null;
    const loggedInScore = loggedInCandidate
      ? findBestCandidate([loggedInCandidate], author).bestScore
      : -1;

    const bestStaffId =
      loggedInScore >= LINK_THRESHOLD ? loggedInCandidate?.id || best.id : best.id;
    const bestScoreToUse = loggedInScore >= LINK_THRESHOLD ? loggedInScore : bestScore;

    const margin = bestScore - secondScore;
    const passesThreshold = bestScoreToUse >= LINK_THRESHOLD;
    const passesMargin = loggedInScore >= LINK_THRESHOLD ? true : margin >= MARGIN_THRESHOLD;
    const notUsedAlready = !usedStaffIds.has(bestStaffId);

    if (!passesThreshold || !passesMargin || !notUsedAlready) {
      return { staffId: null };
    }

    usedStaffIds.add(bestStaffId);
    return { staffId: bestStaffId };
  });
}
