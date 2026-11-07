'use client';

import { ChevronLeft, ChevronRight, Minimize2, X } from 'lucide-react';
import Image from 'next/image';
import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react';

import { StoryProgress } from '@/components/menu/story-progress';
import { useTranslation } from '@/lib/i18n/i18n-context';
import type { StorySlide } from '@/types/stories';

type StoryViewerProps = {
  slides: StorySlide[];
  index: number;
  intervalSeconds: number;
  progressKey: number;
  paused: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onMinimize: () => void;
  onOpenProduct: (slide: StorySlide) => void;
  onHoldChange: (paused: boolean) => void;
};

const HOLD_DELAY_MS = 200;
const SWIPE_THRESHOLD_PX = 50;
const NAV_SUPPRESS_MS = 400;

const controlClass =
  'flex size-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

export function StoryViewer({
  slides,
  index,
  intervalSeconds,
  progressKey,
  paused,
  onClose,
  onNext,
  onPrevious,
  onMinimize,
  onOpenProduct,
  onHoldChange,
}: StoryViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  const onHoldChangeRef = useRef(onHoldChange);
  const holdTimerRef = useRef<number | null>(null);
  const longPressedRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number; at: number } | null>(null);
  const suppressNavUntilRef = useRef(0);
  const { t } = useTranslation();
  const slide = slides[index];

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    onHoldChangeRef.current = onHoldChange;
  }, [onHoldChange]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (!dialog.open) {
      dialog.showModal();
    }

    const handleClose = () => onCloseRef.current();
    dialog.addEventListener('close', handleClose);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      dialog.removeEventListener('close', handleClose);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current !== null) {
        window.clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }

      if (longPressedRef.current) {
        longPressedRef.current = false;
        onHoldChangeRef.current(false);
      }
    };
  }, []);

  if (!slide) {
    return null;
  }

  function clearHoldTimer() {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  function endHold() {
    if (!longPressedRef.current) {
      return;
    }

    longPressedRef.current = false;
    onHoldChangeRef.current(false);
    // Evita que o clique sintetizado a seguir navegue de slide.
    suppressNavUntilRef.current = Date.now() + NAV_SUPPRESS_MS;
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    if ((event.target as HTMLElement).closest('[data-no-hold]')) {
      return;
    }

    clearHoldTimer();
    longPressedRef.current = false;
    pointerStartRef.current = { x: event.clientX, y: event.clientY, at: Date.now() };

    holdTimerRef.current = window.setTimeout(() => {
      holdTimerRef.current = null;
      longPressedRef.current = true;
      onHoldChangeRef.current(true);
    }, HOLD_DELAY_MS);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    clearHoldTimer();

    const start = pointerStartRef.current;
    pointerStartRef.current = null;

    if (longPressedRef.current) {
      endHold();
      return;
    }

    if (!start) {
      return;
    }

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const elapsed = Date.now() - start.at;

    if (
      Math.abs(dx) >= SWIPE_THRESHOLD_PX &&
      Math.abs(dx) > Math.abs(dy) &&
      elapsed < 800
    ) {
      suppressNavUntilRef.current = Date.now() + NAV_SUPPRESS_MS;

      if (dx < 0) {
        onNext();
      } else {
        onPrevious();
      }
    }
  }

  function handlePointerCancel() {
    clearHoldTimer();
    pointerStartRef.current = null;
    endHold();
  }

  function handlePointerLeave() {
    clearHoldTimer();
    pointerStartRef.current = null;
    endHold();
  }

  function handlePreviousClick() {
    if (Date.now() < suppressNavUntilRef.current) {
      return;
    }

    onPrevious();
  }

  function handleNextClick() {
    if (Date.now() < suppressNavUntilRef.current) {
      return;
    }

    onNext();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onNext();
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onPrevious();
    }
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) {
      dialogRef.current?.close();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="story-viewer"
      aria-label={t('stories_label')}
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
    >
      <div
        className="story-viewer-panel touch-pan-y select-none [-webkit-touch-callout:none]"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerLeave}
        onContextMenu={(event) => event.preventDefault()}
      >
        <Image
          key={slide.key}
          src={slide.imageUrl}
          alt={slide.alt}
          fill
          sizes="(min-width: 640px) 45vw, 100vw"
          draggable={false}
          className="object-cover"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/45"
        />

        <StoryProgress
          slides={slides}
          index={index}
          intervalSeconds={intervalSeconds}
          progressKey={progressKey}
          paused={paused}
          className="pt-[calc(env(safe-area-inset-top)+6px)]"
        />

        <div className="absolute top-[calc(env(safe-area-inset-top)+12px)] right-3 z-30 flex items-center gap-2">
          <button
            type="button"
            data-no-hold
            onClick={onMinimize}
            aria-label={t('minimize_stories')}
            className={controlClass}
          >
            <Minimize2 aria-hidden="true" className="size-5" />
          </button>

          <button
            type="button"
            data-no-hold
            autoFocus
            onClick={() => dialogRef.current?.close()}
            aria-label={t('close_stories')}
            className={controlClass}
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <button
          type="button"
          tabIndex={-1}
          onClick={handlePreviousClick}
          aria-label={t('previous_story')}
          className="group absolute inset-y-0 left-0 z-10 flex w-1/2 items-center justify-start pl-2 focus-visible:outline-none"
        >
          <span className="hidden size-10 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 sm:flex">
            <ChevronLeft aria-hidden="true" className="size-5" />
          </span>
        </button>

        <button
          type="button"
          tabIndex={-1}
          onClick={handleNextClick}
          aria-label={t('next_story')}
          className="group absolute inset-y-0 right-0 z-10 flex w-1/2 items-center justify-end pr-2 focus-visible:outline-none"
        >
          <span className="hidden size-10 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 sm:flex">
            <ChevronRight aria-hidden="true" className="size-5" />
          </span>
        </button>

        {slide.product ? (
          <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center bg-gradient-to-t from-black/70 to-transparent p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <button
              type="button"
              data-no-hold
              onClick={() => onOpenProduct(slide)}
              className="inline-flex h-11 items-center rounded-full bg-hero-fg px-5 text-sm font-medium text-deep shadow-lg transition-colors hover:bg-white"
            >
              {t('view_in_menu')}
            </button>
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
