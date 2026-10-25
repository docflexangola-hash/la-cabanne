import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-[11px] font-semibold tracking-[0.22em] text-decor uppercase">
        Erro 404
      </p>
      <h1 className="mt-3 font-display text-3xl text-deep">Página não encontrada</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-2">
        O endereço que abriu não existe ou foi alterado.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-blue px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
      >
        Voltar ao menu
      </Link>
    </main>
  );
}
