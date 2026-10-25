import { BrandLogo } from '@/components/menu/brand-logo';

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ivory/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1100px] items-center justify-between px-4 sm:px-6">
        <BrandLogo priority />

        <p className="text-[11px] font-medium tracking-[0.16em] text-decor uppercase">
          Benguela
        </p>
      </div>
    </header>
  );
}
