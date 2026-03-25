'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { toastSuccess, toastError } from '@/lib/toast';
import { Upload, X, Loader2 } from 'lucide-react';

interface NewsImageUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function NewsImageUploader({ value, onChange }: NewsImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toastError('File too large. Maximum size is 2MB.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/communication/news/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.ok && data.url) {
        onChange(data.url);
        toastSuccess('Image uploaded.');
      } else {
        toastError(data.error || 'Upload failed.');
      }
    } catch {
      toastError('Upload failed unexpectedly.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <FieldLabel>Cover Image</FieldLabel>

      {value && (
        <div className="relative inline-block rounded-md border overflow-hidden">
          <Image
            src={value}
            alt="Article cover"
            width={320}
            height={180}
            className="object-cover"
            unoptimized
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
            title="Remove image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          className="hidden"
          id="news-image-upload"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {value ? 'Replace Image' : 'Upload Image'}
            </>
          )}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">JPEG, PNG, or WebP. Max 2MB.</p>
    </div>
  );
}
