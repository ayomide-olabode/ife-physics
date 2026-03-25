import Link from 'next/link';
import Image from 'next/image';

export type PublicNewsCardItem = {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  date: Date;
  imageUrl: string | null;
};

function toPlainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function NewsCard({ item }: { item: PublicNewsCardItem }) {
  return (
    <div className="bg-white overflow-hidden flex flex-col group">
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 text-base">
            No Image
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1">
        <p className="text-base font-semibold text-gray-500 uppercase tracking-wider mb-2">
          {new Date(item.date).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })}
        </p>

        <h3 className="text-xl font-semibold text-brand-navy mb-2 line-clamp-3">{item.title}</h3>

        {item.body && (
          <p className="text-base text-gray-700 line-clamp-2 mb-3">{toPlainText(item.body)}</p>
        )}

        <div className="mt-auto pt-2">
          <Link
            href={`/news/${item.slug}`}
            className="text-base font-semibold text-brand-navy hover:text-brand-yellow transition-colors"
          >
            Learn More →
          </Link>
        </div>
      </div>
    </div>
  );
}
