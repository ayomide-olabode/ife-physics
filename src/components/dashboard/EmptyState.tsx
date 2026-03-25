import { ReactNode } from 'react';
import { FileQuestion } from 'lucide-react';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed rounded-lg bg-muted/40 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
        <FileQuestion className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-base text-muted-foreground max-w-sm mt-1 mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
