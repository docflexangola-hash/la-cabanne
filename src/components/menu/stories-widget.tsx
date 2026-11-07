'use client';

import { useCallback, useEffect, useState } from 'react';

import { StoryCard, StoryMiniThumbnail } from '@/components/menu/story-card';
import { StoryViewer } from '@/components/menu/story-viewer';
import {
  trackStoryClicked,
  trackStoryMinimized,
  trackStoryViewed,
} from '@/lib/analytics/client';
import { useStoryPlayback } from '@/lib/stories/use-playback';
import { usePreloadImage } from '@/lib/stories/use-preload-image';
import type { StorySlide } from '@/types/stories';

const MINIMIZED_KEY = 'lc_story_minimized';

type StoriesWidgetProps = {
  slides: StorySlide[];
  intervalSeconds: number;
  enabled: boolean;
  onOpenProduct: (slide: StorySlide) => void;
};

export function StoriesWidget({
  slides,
  intervalSeconds,
  enabled,
  onOpenProduct,
}: StoriesWidgetProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [holdPaused, setHoldPaused] = useState(false);
  // Inicializa minimized a partir do sessionStorage via função de initial value (roda em render, não em effect)
  const [minimized, setMinimized] = useState(() => {
    try {
      return window.sessionStorage.getItem(MINIMIZED_KEY) === '1';
    } catch {
      return false;
    }
  });

  const { index, progressKey, next, previous } = useStoryPlayback({
    length: slides.length,
    intervalSeconds,
    active: enabled && menuVisible && !minimized,
    paused: holdPaused,
  });

  const slide = slides[index];
  const nextSlide = slides.length > 1 ? slides[(index + 1) % slides.length] : null;

  usePreloadImage(menuVisible || expanded ? nextSlide?.imageUrl : null);

  useEffect(() => {
    const target = document.getElementById('menu');

    if (!target) {
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      const update = () => {
        const rect = target.getBoundingClientRect();
        setMenuVisible(rect.top < window.innerHeight * 0.8 && rect.bottom > 0);
      };

      update();
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);

      return () => {
        window.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setMenuVisible(Boolean(entry?.isIntersecting));
      },
      { rootMargin: '0px 0px -20% 0px', threshold: 0.01 },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!enabled || !menuVisible || minimized || !slide) {
      return;
    }

    trackStoryViewed({
      storyKey: slide.key,
      productSlug: slide.product?.slug,
      groupSlug: slide.groupSlug,
      categorySlug: slide.categorySlug,
    });
  }, [enabled, menuVisible, minimized, slide]);

  const minimize = useCallback(
    (track: boolean) => {
      setHoldPaused(false);
      setMinimized(true);

      try {
        window.sessionStorage.setItem(MINIMIZED_KEY, '1');
      } catch {
        // sessionStorage é opcional.
      }

      if (track && slide) {
        trackStoryMinimized({ storyKey: slide.key });
      }
    },
    [slide],
  );

  const reopen = useCallback(() => {
    setHoldPaused(false);
    setMinimized(false);

    try {
      window.sessionStorage.removeItem(MINIMIZED_KEY);
    } catch {
      // sessionStorage é opcional.
    }
  }, []);

  const handleOpenProduct = useCallback(
    (current: StorySlide) => {
      if (!current.product) {
        return;
      }

      trackStoryClicked({
        storyKey: current.key,
        productSlug: current.product.slug,
        groupSlug: current.groupSlug,
        categorySlug: current.categorySlug,
      });

      setHoldPaused(false);
      setExpanded(false);
      onOpenProduct(current);
      // Ao abrir o produto, o widget recolhe para a miniatura.
      minimize(false);
    },
    [minimize, onOpenProduct],
  );

  if (!enabled || slides.length === 0 || !slide) {
    return null;
  }

  if (!menuVisible && !expanded) {
    return null;
  }

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+12px)] left-3 z-40 sm:bottom-4 sm:left-4">
      {expanded ? (
        <StoryViewer
          slides={slides}
          index={index}
          intervalSeconds={intervalSeconds}
          progressKey={progressKey}
          paused={holdPaused}
          onClose={() => {
            setHoldPaused(false);
            setExpanded(false);
          }}
          onNext={next}
          onPrevious={previous}
          onMinimize={() => {
            setHoldPaused(false);
            setExpanded(false);
            minimize(true);
          }}
          onOpenProduct={handleOpenProduct}
          onHoldChange={setHoldPaused}
        />
      ) : minimized ? (
        <StoryMiniThumbnail slide={slide} onOpen={reopen} />
      ) : (
        <StoryCard
          slides={slides}
          index={index}
          intervalSeconds={intervalSeconds}
          progressKey={progressKey}
          onMinimize={() => minimize(true)}
          onExpand={() => setExpanded(true)}
          onOpenProduct={handleOpenProduct}
        />
      )}
    </div>
  );
}