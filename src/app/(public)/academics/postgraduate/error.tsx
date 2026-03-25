'use client';

import { PublicErrorBoundary } from '@/components/public/PublicErrorBoundary';

export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <PublicErrorBoundary {...props} />;
}
