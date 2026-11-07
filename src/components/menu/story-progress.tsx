import { cn } from '@/lib/utils';
import type { StorySlide } from '@/types/stories';

export function StoryProgress({
  slides,
  index,
  intervalSeconds,
  progressKey,
  paused = false,
  className,
}: {
  slides: StorySlide[];
  index: number;
  intervalSeconds: number;
  progressKey: number;
  paused?: boolean;
  className?: string;
}) {
  const safeIndex = Math.min(Math.max(index, 0), Math.max(slides.length - 1, 0));

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 z-20 flex gap-1 bg-gradient-to-b from-black/55 to-transparent p-1.5 pb-5',
        className,
      )}
    >
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
              style={{
                animationDuration: `${Math.max(1, intervalSeconds)}s`,
                animationPlayState: paused ? 'paused' : 'running',
              }}
            />
          ) : null}
        </span>
      ))}
    </div>
  );
}
