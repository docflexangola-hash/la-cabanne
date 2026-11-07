'use client';

import { Maximize2, Minimize2 } from 'lucide-react';
import Image from 'next/image';

import { StoryProgress } from '@/components/menu/story-progress';
import { useTranslation } from '@/lib/i18n/i18n-context';
import { cn } from '@/lib/utils';
import type { StorySlide } from '@/types/stories';

type StoryCardProps = {
  slides: StorySlide[];
  index: number;
  intervalSeconds: number;
  progressKey: number;
  onMinimize?: () => void;
  onExpand?: () => void;
  onOpenProduct?: (slide: StorySlide) => void;
  className?: string;
  showMinimize?: boolean;
};

const controlClass =
  'flex size-6 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/70';

export function StoryCard({
  slides,
  index,
  intervalSeconds,
  progressKey,
  onMinimize,
  onExpand,
  onOpenProduct,
  className,
  showMinimize = true,
}: StoryCardProps) {
  const { t } = useTranslation();
  const slide = slides[index];

  if (!slide) {
    return null;
  }

  const interactive = Boolean(slide.product && onOpenProduct);
  const hasControls = Boolean(onExpand) || (showMinimize && onMinimize);

  return (
    <div
      role="group"
      aria-label={t('stories_label')}
      className={cn(
        'relative aspect-[9/16] w-[118px] shrink-0 overflow-hidden rounded-xl bg-deep shadow-[0_14px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/25 sm:w-[140px]',
        className,
      )}
    >
      <Image
        key={slide.key}
        src={slide.imageUrl}
        alt={slide.alt}
        fill
        sizes="(max-width: 640px) 140px, 200px"
        className="object-cover"
      />

      <StoryProgress
        slides={slides}
        index={index}
        intervalSeconds={intervalSeconds}
        progressKey={progressKey}
      />

      {hasControls ? (
        <div className="absolute top-2 right-2 z-20 flex gap-1">
          {onExpand ? (
            <button
              type="button"
              onClick={onExpand}
              aria-label={t('expand_stories')}
              className={controlClass}
            >
              <Maximize2 aria-hidden="true" className="size-3.5" />
            </button>
          ) : null}

          {showMinimize && onMinimize ? (
            <button
              type="button"
              onClick={onMinimize}
              aria-label={t('minimize_stories')}
              className={controlClass}
            >
              <Minimize2 aria-hidden="true" className="size-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}

      {interactive && slide.product ? (
        <button
          type="button"
          onClick={() => onOpenProduct?.(slide)}
          aria-label={`${t('view_product_in_menu')}: ${slide.product.name}`}
          className="absolute inset-0 z-[15] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white"
        />
      ) : null}
    </div>
  );
}

export function StoryMiniThumbnail({
  slide,
  onOpen,
}: {
  slide: StorySlide;
  onOpen: () => void;
}) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t('open_stories')}
      className="relative size-12 overflow-hidden rounded-full border-2 border-white/90 bg-deep shadow-xl ring-1 ring-black/15 transition-transform hover:scale-105"
    >
      <Image
        src={slide.imageUrl}
        alt={slide.alt}
        fill
        sizes="48px"
        className="object-cover"
      />
    </button>
  );
}
