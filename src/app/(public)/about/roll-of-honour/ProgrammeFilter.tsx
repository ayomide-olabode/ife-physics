'use client';

import { useRouter } from 'next/navigation';

export function ProgrammeFilter({
  programmes,
  current,
}: {
  programmes: string[];
  current?: string;
}) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-3">
      <span className="text-base font-medium text-brand-navy">Programme:</span>
      <select
        value={current ?? ''}
        onChange={(e) => {
          const val = e.target.value;
          const params = new URLSearchParams();
          if (val) params.set('programme', val);
          router.push(`/about/roll-of-honour${params.toString() ? `?${params}` : ''}`);
        }}
        className="border border-gray-300 px-3 py-2 text-base bg-white text-brand-ink focus:outline-none focus:border-brand-navy"
      >
        <option value="">All Programmes</option>
        {programmes.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </label>
  );
}
