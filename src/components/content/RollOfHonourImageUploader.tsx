'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { toastError } from '@/lib/toast';

interface RollOfHonourImageUploaderProps {
  value?: string | null;
  onChange: (url: string) => void;
  onRemove: () => void;
}

export function RollOfHonourImageUploader({
  value,
  onChange,
  onRemove,
}: RollOfHonourImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toastError('Invalid file type (JPEG, PNG, WebP only).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toastError('File size exceeds 2MB.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/content/roll-of-honour/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      if (data.ok && data.url) {
        onChange(data.url);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch {
      toastError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      // reset input
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative w-full max-w-sm aspect-[3/4] rounded-md overflow-hidden border bg-muted group">
          <Image
            src={value}
            alt="Roll of Honour preview"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 384px"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onRemove}
              disabled={isUploading}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full max-w-sm aspect-[3/4] rounded-md border-2 border-dashed bg-muted/50 hover:bg-muted/80 transition-colors">
          <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mb-2" />
              ) : (
                <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
              )}
              <p className="space-y-1 text-center">
                <span className="text-base font-semibold block">Click to upload photo</span>
                <span className="text-sm text-muted-foreground block">
                  JPEG, PNG, WebP (max 2MB)
                </span>
                <span className="text-sm text-muted-foreground block">
                  Recommended size: 600x800 (Portrait)
                </span>
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      )}
    </div>
  );
}
