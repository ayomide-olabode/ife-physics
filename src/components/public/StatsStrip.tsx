const stats = [
  { value: '1962', label: 'est.' },
  { value: '3', label: 'academic programmes' },
  { value: '8', label: 'research groups' },
  { value: '2000+', label: 'students' },
];

export function StatsStrip() {
  return (
    <div className="relative z-20 mx-auto mt-8 w-full max-w-6xl px-4 md:mt-10">
      <div className="grid grid-cols-2 border border-gray-200 bg-white text-[#002147] md:grid-cols-4">
        {stats.map((stat, index) => (
          <StatsItem
            key={stat.label}
            value={stat.value}
            label={stat.label}
            className={[
              index % 2 === 0 ? 'border-r border-gray-200 md:border-r-0' : '',
              index < 2 ? 'border-b border-gray-200 md:border-b-0' : '',
              index < stats.length - 1 ? 'md:border-r md:border-gray-200' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          />
        ))}
      </div>
    </div>
  );
}

function StatsItem({
  value,
  label,
  className,
}: {
  value: string | number;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-[114px] flex-col items-center justify-center gap-1 px-3 py-4 text-center sm:min-h-[128px] sm:gap-2 sm:px-4 md:min-h-[136px] md:flex-row md:gap-3 md:px-5 md:text-left ${className ?? ''}`}
    >
      <span className="text-3xl font-bold leading-none sm:text-4xl md:text-5xl">{value}</span>
      <span className="text-sm font-medium tracking-wide text-slate-500 sm:text-base md:w-24 md:text-base  md:tracking-normal">
        {label}
      </span>
    </div>
  );
}
