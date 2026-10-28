import { BrandLogo } from '@/components/menu/brand-logo';

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ivory/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1100px] items-center px-4 sm:px-6">
        <BrandLogo priority />
      </div>
    </header>
  );
}
