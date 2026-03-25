import { useState, useCallback } from 'react';
import { slugify } from '@/lib/slug';

export function useSlugField({
  initialSlug = '',
  isEditing = false,
}: {
  initialSlug?: string;
  isEditing?: boolean;
}) {
  const [slug, setSlug] = useState(initialSlug);
  const [isManual, setIsManual] = useState(isEditing || !!initialSlug);

  const handleTitleChange = useCallback(
    (title: string) => {
      if (!isManual) {
        setSlug(slugify(title));
      }
    },
    [isManual],
  );

  const handleSlugChange = useCallback((newSlug: string) => {
    setIsManual(true);
    setSlug(newSlug);
  }, []);

  const resetSlug = useCallback((currentTitle: string) => {
    setIsManual(false);
    setSlug(slugify(currentTitle));
  }, []);

  return {
    slug,
    isManual,
    handleTitleChange,
    handleSlugChange,
    resetSlug,
  };
}
