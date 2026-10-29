export function MonogramPlaceholder({
  name,
  compact = false,
}: {
  name?: string;
  compact?: boolean;
}) {
  const word = name?.trim().split(/\s+/)[0]?.toUpperCase() ?? 'CARDÁPIO';

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-sand">
      <span
        aria-hidden="true"
        className={
          compact
            ? 'font-display text-2xl leading-none tracking-[-0.04em] text-strong/75'
            : 'font-display text-5xl leading-none tracking-[-0.04em] text-strong/75'
        }
      >
        LC
      </span>
      <span
        className={
          compact
            ? 'text-[8px] font-semibold tracking-[0.22em] text-strong/45'
            : 'text-[10px] font-semibold tracking-[0.22em] text-strong/45'
        }
      >
        {word}
      </span>
    </div>
  );
}
