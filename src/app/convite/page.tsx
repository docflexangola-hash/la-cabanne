import type { Metadata } from 'next';

import { AcceptInviteForm } from '@/components/auth/accept-invite-form';

export const metadata: Metadata = {
  title: 'Definir palavra-passe',
  robots: { index: false, follow: false },
};

export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ivory px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <p className="font-display text-4xl leading-none tracking-tight text-strong">
            La Cabanne
          </p>
          <p className="mt-3 text-[11px] font-medium tracking-[0.22em] text-ink-2 uppercase">
            Menu digital
          </p>
        </div>

        <AcceptInviteForm />

        <p className="mt-6 text-center text-xs text-decor">La Cabanne · Benguela, Angola</p>
      </div>
    </div>
  );
}
