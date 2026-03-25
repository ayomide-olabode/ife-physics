export type PublishStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export function StatusBadge({ status }: { status: PublishStatus }) {
  const styles = {
    DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500',
    PUBLISHED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500',
    ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-sm font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}
