'use client';

import { ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { useState, useRef, type ChangeEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { buildStorageImageUrl } from '@/lib/menu/format';

type ImageUploadProps = {
  currentPath?: string | null;
  currentAlt?: string | null;
  onImageChange: (path: string | null, alt: string | null) => void;
  folder?: string;
};

export function ImageUpload({
  currentPath,
  currentAlt,
  onImageChange,
  folder = 'products',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [altText, setAltText] = useState(currentAlt || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewUrl = currentPath ? buildStorageImageUrl(currentPath) : null;

  async function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Formato inválido. Use JPEG, PNG ou WebP.');
      return;
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('O ficheiro é demasiado grande (máximo 5 MB).');
      return;
    }

    setIsUploading(true);

    try {
      // Process / resize client-side if canvas is supported
      const compressedBlob = await resizeImage(file, 1200, 1200);

      const supabase = createClient();
      const ext = file.type === 'image/png' ? 'png' : 'webp';
      const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = `${folder}/${cleanFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, compressedBlob, {
          contentType: ext === 'png' ? 'image/png' : 'image/webp',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const defaultAlt = altText || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setAltText(defaultAlt);
      onImageChange(filePath, defaultAlt);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar fotografia';
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleRemove() {
    onImageChange(null, null);
    setAltText('');
    setErrorMessage(null);
  }

  function handleAltChange(value: string) {
    setAltText(value);
    onImageChange(currentPath || null, value);
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold tracking-wider text-decor uppercase">
        Fotografia
      </label>

      {previewUrl ? (
        <div className="space-y-3">
          <div className="relative aspect-4/3 w-full max-w-sm overflow-hidden rounded-xl border border-line bg-surface-2">
            <Image
              src={previewUrl}
              alt={altText || 'Pré-visualização'}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 384px"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-lg bg-deep/80 text-white hover:bg-danger transition-colors shadow-sm"
              title="Remover fotografia"
            >
              <Trash2 className="size-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-2">
              Texto alternativo (acessibilidade / SEO) <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={altText}
              onChange={(e) => handleAltChange(e.target.value)}
              placeholder="Ex.: Prato de Garoupa Grelhada com legumes e batata"
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink bg-white focus:border-blue focus:outline-hidden"
              required
            />
          </div>
        </div>
      ) : (
        <div>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line p-6 text-center cursor-pointer hover:border-blue hover:bg-blue-tint/20 transition-colors"
          >
            {isUploading ? (
              <Loader2 className="size-8 animate-spin text-blue" />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-full bg-surface-2 text-ink-2">
                <UploadCloud className="size-6 text-decor" />
              </div>
            )}
            <div className="text-sm">
              <span className="font-medium text-blue">Clique para carregar</span> ou arraste uma foto
            </div>
            <p className="text-xs text-ink-2">JPEG, PNG ou WebP até 5 MB (lado maior redimensionado para 1200px)</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </div>
      )}

      {errorMessage && (
        <p className="text-xs text-danger">{errorMessage}</p>
      )}
    </div>
  );
}

/**
 * Resizes image client-side keeping aspect ratio up to max dimensions
 */
function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else resolve(file);
          },
          'image/webp',
          0.85,
        );
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
