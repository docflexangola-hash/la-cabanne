import type { RestaurantSettings, WeekHours } from '@/types/menu';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

const DAY_LABELS: Record<string, string> = {
  mon: 'Segunda',
  tue: 'Terça',
  wed: 'Quarta',
  thu: 'Quinta',
  fri: 'Sexta',
  sat: 'Sábado',
  sun: 'Domingo',
};

export type OpenState = {
  open: boolean;
  label: string;
};

function toMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatTime(value: string): string {
  return value.trim().slice(0, 5);
}

function hasAnyHours(hours: WeekHours): boolean {
  return Object.values(hours).some((intervals) => Array.isArray(intervals) && intervals.length > 0);
}

export function getOpenState(
  settings: RestaurantSettings,
  now: Date = new Date(),
): OpenState | null {
  if (settings.isOpenOverride !== null) {
    return {
      open: settings.isOpenOverride,
      label: settings.isOpenOverride ? 'Aberto' : 'Fechado',
    };
  }

  if (!hasAnyHours(settings.hours)) {
    return null;
  }

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Luanda',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);

  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? '';
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');

  const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);

  if (dayIndex < 0) {
    return null;
  }

  const currentMinutes = hour * 60 + minute;

  // Procura o próximo intervalo de abertura nos próximos 7 dias.
  for (let offset = 0; offset < 7; offset += 1) {
    const key = DAY_KEYS[(dayIndex + offset) % 7];
    const intervals = settings.hours[key];

    if (!Array.isArray(intervals)) {
      continue;
    }

    for (const interval of intervals) {
      const from = toMinutes(interval[0]);
      const to = toMinutes(interval[1]);

      if (from === null || to === null) {
        continue;
      }

      const closesAt = to <= from ? to + 24 * 60 : to;

      if (offset === 0 && currentMinutes >= from && currentMinutes < closesAt) {
        return {
          open: true,
          label: `Aberto · fecha às ${formatTime(interval[1])}`,
        };
      }

      if (offset === 0 && currentMinutes < from) {
        return {
          open: false,
          label: `Fechado · abre às ${formatTime(interval[0])}`,
        };
      }

      if (offset > 0) {
        const dayLabel = DAY_LABELS[key] ?? key;

        return {
          open: false,
          label: `Fechado · abre ${dayLabel.toLowerCase()} às ${formatTime(interval[0])}`,
        };
      }
    }
  }

  return { open: false, label: 'Fechado' };
}

export function getTodayKey(now: Date = new Date()): string {
  const weekday = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Luanda',
    weekday: 'short',
  }).format(now);

  const index = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);

  return index >= 0 ? DAY_KEYS[index] : '';
}

export function getHoursRows(hours: WeekHours): Array<{
  key: string;
  label: string;
  value: string;
}> {  return Object.keys(DAY_LABELS).map((key) => {
    const intervals = hours[key];

    if (!Array.isArray(intervals) || intervals.length === 0) {
      return { key, label: DAY_LABELS[key], value: 'Fechado' };
    }

    return {
      key,
      label: DAY_LABELS[key],
      value: intervals.map(([from, to]) => `${formatTime(from)}–${formatTime(to)}`).join(' · '),
    };
  });
}
