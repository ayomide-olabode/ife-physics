import { listPublicLegacyGallery } from '@/server/public/queries/legacyGalleryPublic';
import { Pagination } from '@/components/public/Pagination';
import { LegacyGalleryModal } from '@/components/public/about/LegacyGalleryModal';

export default async function LegacyGalleryPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Math.max(1, Number(searchParams.page) || 1);
  const pageSize = 12;

  const result = await listPublicLegacyGallery({ page, pageSize });

  return (
    <div className="py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif font-bold text-brand-navy mb-3">Legacy Gallery</h1>
        <p className="text-gray-600 mb-10 max-w-2xl">
          Honouring distinguished members who have shaped the legacy of the department.
        </p>

        {result.items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              No legacy gallery items published yet. Check back soon.
            </p>
          </div>
        ) : (
          <>
            <LegacyGalleryModal items={result.items} />

            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              basePath="/about/legacy-gallery"
            />
          </>
        )}
      </div>
    </div>
  );
}
