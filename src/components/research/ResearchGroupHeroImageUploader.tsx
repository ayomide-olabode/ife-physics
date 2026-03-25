'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { toastError, toastSuccess } from '@/lib/toast';
import { Loader2, Upload, X } from 'lucide-react';

interface ResearchGroupHeroImageUploaderProps {
  value: string | null;
  groupId?: string;
  onChange: (url: string | null) => void;
}

export function ResearchGroupHeroImageUploader({
  value,
  groupId,
  onChange,
}: ResearchGroupHeroImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toastError('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toastError('File is too large. Maximum size is 2MB.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (groupId) {
        formData.append('groupId', groupId);
      }

      const res = await fetch('/api/research/groups/upload-hero', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data?.ok || !data?.url) {
        throw new Error(data?.error || 'Upload failed.');
      }

      onChange(data.url);
      toastSuccess('Hero banner uploaded.');
    } catch (error: unknown) {
      toastError(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <FieldLabel htmlFor="research-group-hero-upload">Hero Banner Image</FieldLabel>

      {value ? (
        <div className="relative overflow-hidden border rounded-none bg-muted">
          <div className="relative aspect-[21/7] w-full">
            <Image
              src={value}
              alt="Research group hero preview"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 960px"
            />
          </div>

          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
            title="Remove hero image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <input
          id="research-group-hero-upload"
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-none"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {value ? 'Replace Image' : 'Upload Image'}
            </>
          )}
        </Button>

        {value ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onChange(null)}
            disabled={uploading}
            className="rounded-none"
          >
            Remove
          </Button>
        ) : null}
      </div>

      <p className="text-sm text-muted-foreground">
        JPEG, PNG, or WebP. Max 2MB. Recommended: wide landscape image, optimized for web.
      </p>
    </div>
  );
}
