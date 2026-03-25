'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/editor/RichTextEditorLazy';
import { createNews, updateNews } from '@/server/actions/news';
import { toastSuccess, toastError } from '@/lib/toast';
import { useSlugField } from '@/lib/useSlugField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { NewsImageUploader } from '@/components/communication/NewsImageUploader';
import { RefreshCw } from 'lucide-react';

type NewsFormData = {
  id?: string;
  title?: string;
  slug?: string;
  body?: string;
  imageUrl?: string | null;
  date?: string;
  buttonLabel?: string | null;
  buttonLink?: string | null;
};

export function NewsFormClient({ initial }: { initial?: NewsFormData }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initial?.id;

  const [title, setTitle] = useState(initial?.title || '');
  const { slug, isManual, handleTitleChange, handleSlugChange, resetSlug } = useSlugField({
    initialSlug: initial?.slug,
    isEditing,
  });
  const [body, setBody] = useState(initial?.body || '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || '');
  const [date, setDate] = useState(
    initial?.date
      ? new Date(initial.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
  );
  const [buttonLabel, setButtonLabel] = useState(initial?.buttonLabel || '');
  const [buttonLink, setButtonLink] = useState(initial?.buttonLink || '');
  const onTitleChange = (val: string) => {
    setTitle(val);
    handleTitleChange(val);
  };

  const handleBodyChange = useCallback((html: string) => {
    setBody(html);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = {
        title,
        slug,
        body,
        imageUrl: imageUrl || '',
        date,
        buttonLabel: buttonLabel || '',
        buttonLink: buttonLink || '',
      };

      if (isEditing && initial?.id) {
        const res = await updateNews(initial.id, payload);
        if (res.success) {
          toastSuccess('Article updated.');
          router.refresh();
        } else {
          toastError(res.error || 'Failed to update article.');
        }
        setIsSubmitting(false);
        return;
      }

      const res = await createNews(payload);
      if (res.success && res.data?.id) {
        toastSuccess('Article created as draft.');
        window.location.assign(`/dashboard/communication/news/${res.data.id}`);
        return;
      }

      toastError(res.error || 'Failed to create article.');
    } catch {
      toastError('An unexpected error occurred.');
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <FieldLabel required htmlFor="title">
            Title
          </FieldLabel>
          <Input
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Article title"
            required
          />
        </div>
        <div className="space-y-2">
          <FieldLabel required htmlFor="slug">
            Slug
          </FieldLabel>
          <div className="flex gap-2">
            <Input
              id="slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="article-slug"
              required
            />
            {isManual && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => resetSlug(title)}
                title="Sync from title"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <FieldLabel required htmlFor="date">
            Date
          </FieldLabel>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      <NewsImageUploader value={imageUrl || null} onChange={(url) => setImageUrl(url || '')} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <FieldLabel htmlFor="buttonLabel">Button Label</FieldLabel>
          <Input
            id="buttonLabel"
            value={buttonLabel}
            onChange={(e) => setButtonLabel(e.target.value)}
            placeholder="Read More"
          />
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor="buttonLink">Button Link</FieldLabel>
          <Input
            id="buttonLink"
            value={buttonLink}
            onChange={(e) => setButtonLink(e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <FieldLabel required>Body</FieldLabel>
        <RichTextEditor value={body} onChange={handleBodyChange} />
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEditing ? 'Update Article' : 'Create Draft'}
        </Button>
      </div>
    </form>
  );
}
