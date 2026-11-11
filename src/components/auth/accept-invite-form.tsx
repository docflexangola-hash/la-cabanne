'use client';

import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { setPasswordSchema } from '@/lib/validations/user';

type Status = 'loading' | 'ready' | 'invalid' | 'inactive';

const CARD_CLASS =
  'rounded-2xl border border-line bg-surface p-6 shadow-[0_24px_60px_rgba(18,62,100,0.08)] sm:p-8';

const INPUT_CLASS =
  'h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-decor focus-visible:border-blue focus-visible:ring-2 focus-visible:ring-blue/25 focus-visible:outline-none disabled:opacity-60';

const BUTTON_CLASS =
  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue text-sm font-semibold text-primary-foreground transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue/40 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50';

export function AcceptInviteForm() {
  const router = useRouter();

  const [status, setStatus] = useState<Status>('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '',
    );
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const urlError = params.get('error_description') ?? params.get('error');

    const supabase = createClient();
    let active = true;

    async function acceptInvite() {
      if (urlError || !accessToken || !refreshToken) {
        if (active) {
          setStatus('invalid');
        }
        return;
      }

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (!active) return;

      if (error || !data.session) {
        setStatus('invalid');
        return;
      }

      setEmail(data.session.user.email ?? '');
      setStatus('ready');

      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`,
      );
    }

    acceptInvite().catch(() => {
      if (active) {
        setStatus('invalid');
      }
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setFieldErrors({});

    const parsed = setPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    setPending(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (error || !data.user) {
      setPending(false);
      setMessage(
        error?.message || 'Não foi possível guardar a palavra-passe. Tenta novamente.',
      );
      return;
    }

    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('is_active')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profile && profile.is_active === false) {
      // Sem sessão activa não há ciclo de redirects entre login e dashboard.
      await supabase.auth.signOut();
      setPending(false);
      setStatus('inactive');
      return;
    }

    router.replace('/admin/dashboard');
  }

  if (status === 'loading') {
    return (
      <div className={CARD_CLASS}>
        <p className="flex items-center gap-3 text-sm text-ink-2" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          A validar o convite…
        </p>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className={CARD_CLASS}>
        <h1 className="font-display text-2xl text-strong">Convite inválido</h1>
        <p className="mt-2 text-sm text-ink-2">
          Este link já foi usado ou expirou. Pede a um administrador que envie um novo convite.
        </p>
        <Link href="/admin/login" className={`mt-6 ${BUTTON_CLASS}`}>
          Ir para o login
        </Link>
      </div>
    );
  }

  if (status === 'inactive') {
    return (
      <div className={CARD_CLASS}>
        <h1 className="font-display text-2xl text-strong">Palavra-passe definida</h1>
        <p className="mt-2 text-sm text-ink-2">
          A tua conta ainda não está activa. Pede a um administrador para a activar e depois
          entra com a palavra-passe que acabaste de escolher.
        </p>
        <Link href="/admin/login" className={`mt-6 ${BUTTON_CLASS}`}>
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <div className={CARD_CLASS}>
      <h1 className="font-display text-2xl text-strong">Definir palavra-passe</h1>
      <p className="mt-1 text-sm text-ink-2">
        Bem-vindo à equipa da La Cabanne. Escolhe a palavra-passe com que vais entrar no painel.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="invite-email" className="block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="invite-email"
            type="email"
            value={email}
            readOnly
            disabled
            className={INPUT_CLASS}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="invite-password" className="block text-sm font-medium text-ink">
            Palavra-passe
          </label>
          <div className="relative">
            <input
              id="invite-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={12}
              required
              placeholder="Pelo menos 12 caracteres"
              className={`${INPUT_CLASS} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-decor transition-colors hover:text-ink"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {fieldErrors.password ? (
            <p className="text-xs text-danger">{fieldErrors.password[0]}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="invite-confirm" className="block text-sm font-medium text-ink">
            Confirmar palavra-passe
          </label>
          <input
            id="invite-confirm"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={12}
            required
            className={INPUT_CLASS}
          />
          {fieldErrors.confirmPassword ? (
            <p className="text-xs text-danger">{fieldErrors.confirmPassword[0]}</p>
          ) : null}
        </div>

        {message ? (
          <p
            role="alert"
            className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
          >
            {message}
          </p>
        ) : null}

        <button type="submit" disabled={pending} className={BUTTON_CLASS}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Definir palavra-passe e entrar
        </button>
      </form>
    </div>
  );
}
