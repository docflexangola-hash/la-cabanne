'use client';

import {
  Clock,
  Globe,
  Info,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Power,
  Save,
} from 'lucide-react';
import { useState, useTransition } from 'react';
import {
  toggleOpenOverride,
  updateRestaurantSettings,
} from '@/lib/actions/settings';
import type { RestaurantSettingsInput } from '@/lib/validations/settings';

const DAYS = [
  { key: 'mon', label: 'Segunda-feira' },
  { key: 'tue', label: 'Terça-feira' },
  { key: 'wed', label: 'Quarta-feira' },
  { key: 'thu', label: 'Quinta-feira' },
  { key: 'fri', label: 'Sexta-feira' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
] as const;

export function SettingsForm({
  initialSettings,
}: {
  initialSettings: RestaurantSettingsInput;
}) {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(initialSettings.name || 'La Cabanne');
  const [phone, setPhone] = useState(initialSettings.phone || '');
  const [whatsapp, setWhatsapp] = useState(initialSettings.whatsapp || '');
  const [email, setEmail] = useState(initialSettings.email || '');
  const [address, setAddress] = useState(initialSettings.address || '');
  const [instagram, setInstagram] = useState(initialSettings.instagram || '');
  const [infoMessage, setInfoMessage] = useState(initialSettings.infoMessage || '');
  const [isOpenOverride, setIsOpenOverride] = useState<boolean | null>(
    initialSettings.isOpenOverride ?? null,
  );

  // Hours: default or existing
  const [hours, setHours] = useState<Record<string, Array<[string, string]> | null>>(() => {
    const existing = initialSettings.hours || {};
    const init: Record<string, Array<[string, string]> | null> = {};
    for (const d of DAYS) {
      init[d.key] = existing[d.key] || null;
    }
    return init;
  });

  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  // Toggle day open/closed
  function toggleDay(key: string) {
    setHours((prev: any) => ({
      ...prev,
      [key]: prev[key] ? null : [['12:00', '23:00']],
    }));
  }

  // Update interval times
  function updateTime(
    dayKey: string,
    intervalIndex: number,
    point: 0 | 1,
    value: string,
  ) {
    setHours((prev: any) => {
      const current = prev[dayKey] ? [...prev[dayKey]!] : [['12:00', '23:00']];
      current[intervalIndex] = point === 0
        ? [value, current[intervalIndex][1]]
        : [current[intervalIndex][0], value];
      return { ...prev, [dayKey]: current };
    });
  }

  // Handle open override toggle directly
  async function handleOverrideChange(val: boolean | null) {
    setIsOpenOverride(val);
    startTransition(async () => {
      const res = await toggleOpenOverride(val);
      if (res.success) {
        setFeedback({ type: 'ok', text: res.message || 'Estado de abertura alterado' });
      } else {
        setFeedback({ type: 'error', text: res.message || 'Erro ao alterar estado' });
      }
    });
  }

  // Submit full settings form
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const payload: RestaurantSettingsInput = {
      name,
      phone: phone || null,
      whatsapp: whatsapp || null,
      email: email || null,
      address: address || null,
      instagram: instagram || null,
      infoMessage: infoMessage || null,
      isOpenOverride,
      hours: hours as RestaurantSettingsInput['hours'],
    };

    startTransition(async () => {
      const res = await updateRestaurantSettings(payload);
      if (res.success) {
        setFeedback({ type: 'ok', text: res.message || 'Configurações guardadas com sucesso' });
      } else {
        setFeedback({ type: 'error', text: res.message || 'Erro ao guardar configurações' });
      }
    });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl text-deep">Configurações</h1>
        <p className="mt-1 text-sm text-ink-2">
          Identidade, contactos, redes sociais, horário semanal e estado de abertura do restaurante.
        </p>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-sm ${
            feedback.type === 'ok'
              ? 'bg-[#2E7D5B]/10 text-[#2E7D5B] border border-[#2E7D5B]/20'
              : 'bg-danger/10 text-danger border border-danger/20'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold uppercase hover:underline ml-4"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Immediate Override Banner */}
      <div className="rounded-2xl border border-line bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-tint text-deep">
              <Power className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-lg text-deep">Controlo Imediato de Abertura</h2>
              <p className="text-xs text-ink-2">
                Força o estado do restaurante para aberto ou fechado no menu público, ou segue o horário automático.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-surface-2 p-1 border border-line">
            <button
              type="button"
              onClick={() => handleOverrideChange(null)}
              disabled={isPending}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isOpenOverride === null
                  ? 'bg-white text-deep shadow-xs'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              Automático
            </button>
            <button
              type="button"
              onClick={() => handleOverrideChange(true)}
              disabled={isPending}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isOpenOverride === true
                  ? 'bg-[#2E7D5B] text-white shadow-xs'
                  : 'text-ink-2 hover:text-[#2E7D5B]'
              }`}
            >
              Aberto
            </button>
            <button
              type="button"
              onClick={() => handleOverrideChange(false)}
              disabled={isPending}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isOpenOverride === false
                  ? 'bg-danger text-white shadow-xs'
                  : 'text-ink-2 hover:text-danger'
              }`}
            >
              Fechado
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity & Contacts */}
        <div className="rounded-2xl border border-line bg-white p-6 space-y-4">
          <h2 className="font-display text-xl text-deep">Identidade e Contactos</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-decor uppercase">
                Nome do Restaurante <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="La Cabanne"
                className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-blue focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-decor uppercase">
                Instagram
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-decor font-mono">
                  @
                </span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="lacabanne.benguela"
                  className="w-full rounded-lg border border-line pl-7 pr-3 py-2 text-sm text-ink focus:border-blue focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-decor uppercase">
                Telefone Principal
              </label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-decor" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+244 9XX XXX XXX"
                  className="w-full rounded-lg border border-line pl-9 pr-3 py-2 text-sm text-ink focus:border-blue focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-decor uppercase">
                WhatsApp
              </label>
              <div className="relative mt-1">
                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-decor" />
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+244 9XX XXX XXX"
                  className="w-full rounded-lg border border-line pl-9 pr-3 py-2 text-sm text-ink focus:border-blue focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-decor uppercase">
                Email de Contacto
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-decor" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contacto@lacabanne.ao"
                  className="w-full rounded-lg border border-line pl-9 pr-3 py-2 text-sm text-ink focus:border-blue focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-decor uppercase">
                Morada / Localização
              </label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-decor" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Praia Morena, Benguela, Angola"
                  className="w-full rounded-lg border border-line pl-9 pr-3 py-2 text-sm text-ink focus:border-blue focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-decor uppercase">
              Mensagem Informativa no Topo do Menu (Opcional)
            </label>
            <input
              type="text"
              value={infoMessage}
              onChange={(e) => setInfoMessage(e.target.value)}
              placeholder="Ex.: Jantar de Fim de Semana com música ao vivo a partir das 20h"
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-blue focus:outline-hidden"
            />
            <p className="mt-1 text-xs text-ink-2">
              Se preenchida, aparece em destaque na barra informativa do menu público.
            </p>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="rounded-2xl border border-line bg-white p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-deep" />
            <h2 className="font-display text-xl text-deep">Horário Semanal de Funcionamento</h2>
          </div>
          <p className="text-xs text-ink-2">
            Defina os dias e horas em que a cozinha e o espaço estão a servir. Dias desativados aparecem como &quot;Encerrado&quot;.
          </p>

          <div className="space-y-3 pt-2">
            {DAYS.map((day) => {
              const dayHours = hours[day.key];
              const isOpen = Boolean(dayHours && dayHours.length > 0);
              const [start, end] = dayHours?.[0] || ['12:00', '23:00'];

              return (
                <div
                  key={day.key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-line p-3 hover:bg-surface-2/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleDay(day.key)}
                      className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                        isOpen
                          ? 'bg-[#2E7D5B]/10 text-[#2E7D5B]'
                          : 'bg-decor/10 text-decor'
                      }`}
                    >
                      {isOpen ? 'Aberto' : 'Encerrado'}
                    </button>
                    <span className="text-sm font-medium text-ink w-32">{day.label}</span>
                  </div>

                  {isOpen ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={start}
                        onChange={(e) => updateTime(day.key, 0, 0, e.target.value)}
                        className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-mono text-ink focus:border-blue focus:outline-hidden"
                      />
                      <span className="text-xs text-decor">até às</span>
                      <input
                        type="time"
                        value={end}
                        onChange={(e) => updateTime(day.key, 0, 1, e.target.value)}
                        className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-mono text-ink focus:border-blue focus:outline-hidden"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-decor font-mono italic">Encerrado para descanso</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Guardar Configurações
          </button>
        </div>
      </form>
    </div>
  );
}
