'use client';

import { useMemo } from 'react';

import { StoryCard } from '@/components/menu/story-card';
import { buildStorySlides } from '@/lib/stories/build';
import { useStoryPlayback } from '@/lib/stories/use-playback';
import type { MenuGroup } from '@/types/menu';
import type { StoryConfig, StoryConfigItem, StorySettings } from '@/types/stories';

export function StoriesPreview({
  menuGroups,
  settings,
  items,
}: {
  menuGroups: MenuGroup[];
  settings: StorySettings;
  items: StoryConfigItem[];
}) {
  const config = useMemo<StoryConfig>(() => ({ settings, items }), [settings, items]);

  const slides = useMemo(
    () => buildStorySlides(menuGroups, config, { shuffle: true, seed: 7 }),
    [menuGroups, config],
  );

  const { index, progressKey } = useStoryPlayback({
    length: slides.length,
    intervalSeconds: settings.intervalSeconds,
    active: true,
  });

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg text-strong">Pré-visualização</h2>
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-ink-2 uppercase">
          9:16
        </span>
      </div>

      <p className="mt-1 text-xs text-ink-2">
        O mesmo cartão que aparece no canto inferior esquerdo do site.
      </p>

      <div className="mt-5 flex justify-center">
        {slides.length > 0 ? (
          <div className="rounded-[2rem] border-[6px] border-deep bg-deep p-1.5 shadow-2xl">
            <StoryCard
              slides={slides}
              index={index}
              intervalSeconds={settings.intervalSeconds}
              progressKey={progressKey}
              showMinimize={false}
              className="w-[190px] sm:w-[210px]"
            />
          </div>
        ) : (
          <div className="flex aspect-[9/16] w-[190px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface-2 p-4 text-center sm:w-[210px]">
            <p className="text-sm font-medium text-ink">Sem imagens para mostrar</p>
            <p className="text-xs text-ink-2">
              Adicione produtos ou imagens no modo manual.
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 space-y-1 text-center text-xs text-ink-2">
        <p>
          {slides.length} {slides.length === 1 ? 'imagem' : 'imagens'} · auto-avanço de{' '}
          {settings.intervalSeconds}s
        </p>
        {!settings.enabled ? (
          <p className="font-medium text-danger">Os stories estão desativados no site.</p>
        ) : null}
      </div>
    </div>
  );
}
