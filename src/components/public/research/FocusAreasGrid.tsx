type FocusAreaItem = {
  id: string;
  title: string;
  description: string | null;
};

export function FocusAreasGrid({ items }: { items: FocusAreaItem[] }) {
  if (items.length === 0) {
    return (
      <div className="border border-gray-200 bg-white p-6 text-base text-gray-500 rounded-none">
        No focus areas available for this group yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <article key={item.id} className="border border-gray-200 bg-white rounded-none p-5">
          <div className="space-y-2">
            <h3 className="text-brand-navy font-semibold leading-snug">{item.title}</h3>
            <p className="text-base text-gray-600 leading-relaxed line-clamp-3">
              {item.description?.trim() ? item.description : 'No description available yet.'}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
