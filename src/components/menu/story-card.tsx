'use client';

import { Minimize2 } from 'lucide-react';
import Image from 'next/image';

import { cn } from '@/lib/utils';
import type { StorySlide } from '@/types/stories';

type StoryCardProps = {
  slides: StorySlide[];
  index: number;
  intervalSeconds: number;
  progressKey: number;
  onMinimize?: () => void;
  onOpenProduct?: (slide: StorySlide) => void;
  className?: string;
  showMinimize?: boolean;
};

export function StoryCard({
  slides,
  index,
  intervalSeconds,
  progressKey,
  onMinimize,
  onOpenProduct,
  className,
  showMinimize = true,
}: StoryCardProps) {
  const slide = slides[index];

  if (!slide) {
    return null;
  }

  const interactive = Boolean(slide.product && onOpenProduct);
  const safeIndex = Math.min(Math.max(index, 0), Math.max(slides.length - 1, 0));

  return (
    <div
      role="group"
      aria-label="Stories do menu"
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

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex gap-1 bg-gradient-to-b from-black/55 to-transparent p-1.5 pb-5">
        {slides.map((item, position) => (
          <span
            key={item.key}
            className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/35"
          >
            {position < safeIndex ? (
              <span className="block h-full w-full bg-white" />
            ) : position === safeIndex ? (
              <span
                key={`${safeIndex}-${progressKey}`}
                className="story-progress-fill block h-full bg-white"
                style={{ animationDuration: `${Math.max(1, intervalSeconds)}s` }}
              />
            ) : null}
          </span>
        ))}
      </div>

      {showMinimize && onMinimize ? (
        <button
          type="button"
          onClick={onMinimize}
          aria-label="Minimizar stories"
          className="absolute top-2 right-2 z-20 flex size-6 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
        >
          <Minimize2 aria-hidden="true" className="size-3.5" />
        </button>
      ) : null}

      {interactive && slide.product ? (
        <button
          type="button"
          onClick={() => onOpenProduct?.(slide)}
          aria-label={`Ver ${slide.product.name} no menu`}
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
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Abrir stories"
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
