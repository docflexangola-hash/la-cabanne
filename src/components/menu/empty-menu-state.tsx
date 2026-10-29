import Link from 'next/link';

export function EmptyMenuState({
  variant = 'preparing',
}: {
  variant?: 'preparing' | 'error';
}) {
  const isError = variant === 'error';

  return (
    <section
      aria-labelledby="menu-empty-title"
      className="mt-10 rounded-card border border-line bg-surface px-6 py-14 text-center sm:px-10 sm:py-16"
    >
      <div
        aria-hidden="true"
        className="mx-auto flex h-24 w-24 items-center justify-center rounded-tile border border-sand-line bg-sand"
      >
        <span className="font-display text-4xl leading-none tracking-[-0.04em] text-strong">
          LC
        </span>
      </div>

      <p className="mt-7 text-[11px] font-semibold tracking-[0.22em] text-decor uppercase">
        Cardápio
      </p>

      <h1
        id="menu-empty-title"
        className="mt-2 font-display text-3xl leading-tight text-strong sm:text-[2.5rem]"
      >
        {isError ? 'Não foi possível carregar o menu' : 'O cardápio está a ser preparado'}
      </h1>

      <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink-2">
        {isError
          ? 'Verifica a ligação e tenta novamente dentro de instantes. O menu volta a ficar disponível assim que a ligação for restabelecida.'
          : 'Os produtos, descrições e preços aparecem aqui assim que a importação for revista e aprovada pela gerência. Não mostramos informação por confirmar.'}
      </p>

      {isError ? (
        <Link
          href="/"
          className="mt-7 inline-flex h-11 items-center justify-center rounded-md bg-blue px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Tentar de novo
        </Link>
      ) : null}

      <div aria-hidden="true" className="mx-auto mt-9 h-px w-16 bg-sand-line" />

      <p className="mt-6 text-xs leading-relaxed text-decor">
        Preços em kwanzas (Kz), com IVA incluído.
      </p>
    </section>
  );
}
