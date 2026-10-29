import Image from 'next/image';
import Link from 'next/link';

export function BrandLogo({ priority = false, dark = false }: { priority?: boolean; dark?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="La Cabanne — início"
      className="inline-flex items-center rounded-sm"
    >
      <Image
        src={dark ? '/brand/02-logo-mono-claro.png' : '/brand/01-logo-cor.png'}
        alt="La Cabanne"
        width={1200}
        height={416}
        priority={priority}
        className="h-6 w-auto sm:h-7"
        sizes="200px"
      />
    </Link>
  );
}
