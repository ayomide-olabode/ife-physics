import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { ScopedRole } from '.prisma/client';
import { notFound } from 'next/navigation';
import { getNewsById } from '@/server/queries/news';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { NewsFormClient } from '@/components/communication/NewsFormClient';
import { NewsStatusActions } from '@/components/communication/NewsStatusActions';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  const { id } = await params;
  const article = await getNewsById(id);

  if (!article) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <BackToParent href="/dashboard/communication/news" label="Back to News" />
      <div className="flex items-start justify-between flex-wrap gap-4">
        <PageHeader title="Edit Article" description={`Update "${article.title}".`} />
        <NewsStatusActions id={article.id} status={article.status} />
      </div>
      <div className="rounded-lg border bg-card p-6">
        <NewsFormClient
          initial={{
            id: article.id,
            title: article.title,
            slug: article.slug,
            body: article.body,
            imageUrl: article.imageUrl,
            date: article.date.toISOString(),
            buttonLabel: article.buttonLabel,
            buttonLink: article.buttonLink,
          }}
        />
      </div>
    </div>
  );
}
