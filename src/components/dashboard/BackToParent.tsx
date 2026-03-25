import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function BackToParent({ href, label }: { href: string; label: string }) {
  return (
    <div className="mb-4">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="-ml-3 text-muted-foreground hover:text-foreground"
      >
        <Link href={href}>
          <ArrowLeft className="h-4 w-4" />
          {label}
        </Link>
      </Button>
    </div>
  );
}
