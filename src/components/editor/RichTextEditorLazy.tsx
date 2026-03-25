'use client';

import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('./RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="rounded-md border bg-muted/40 p-4 text-base text-muted-foreground animate-pulse min-h-[200px] flex items-center justify-center">
      Loading editor…
    </div>
  ),
});

export { RichTextEditor };
