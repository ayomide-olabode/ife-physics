import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function AddNewButton({ href, label = 'Add New' }: { href: string; label?: string }) {
  return (
    <Button asChild size="sm" variant="default">
      <Link href={href}>
        <Plus className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}
