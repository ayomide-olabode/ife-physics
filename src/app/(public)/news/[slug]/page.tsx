import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getPublicNewsBySlug } from '@/server/public/queries/newsPublic';
import { Prose } from '@/components/public/Prose';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublicNewsBySlug(slug);
  if (!article) return { title: 'Not Found' };
  return {
    title: article.title,
    description: article.title,
  };
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getPublicNewsBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="py-16">
      <div className="mx-auto max-w-[900px] px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/news"
          className="inline-flex items-center text-base text-brand-navy hover:text-brand-yellow transition-colors mb-8"
        >
          ← Back to News
        </Link>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-navy leading-tight mb-4">
          {article.title}
        </h1>

        {/* Date */}
        <p className="text-base text-brand-yellow font-semibold uppercase tracking-wider mb-8">
          {new Date(article.date).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })}
        </p>

        {/* Hero image */}
        {article.imageUrl && (
          <div className="relative w-full aspect-video mb-10">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              sizes="(max-width: 900px) 100vw, 900px"
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Body */}
        <Prose html={article.body} />

        {/* CTA button */}
        {article.buttonLabel && article.buttonLink && (
          <div className="mt-10">
            <Link
              href={article.buttonLink}
              className="inline-block bg-brand-yellow text-brand-ink font-semibold px-8 py-3 text-base hover:bg-yellow-500 transition-colors"
            >
              {article.buttonLabel}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
