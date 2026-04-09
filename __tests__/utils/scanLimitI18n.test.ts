import {
  buildScanLimitMessage,
  buildScanLimitPaywallTitle,
  formatScanLimitTime,
  getScanLimitUpgradeSubtitle,
  resolveScanLimitMessageKey,
} from '@/utils/scanLimitI18n';

const translations: Record<string, string> = {
  'common.day': 'jour',
  'common.days': 'jours',
  'common.hour': 'heure',
  'common.hours': 'heures',
  'common.minute': 'minute',
  'common.minutes': 'minutes',
  'scan_limit.limit_reached': 'Limite atteinte',
  'scan_limits.msg_monthly_reached_with_time': 'Limite mensuelle atteinte. Prochain scan disponible dans {{time}}',
  'scan_limits.next_scan_available_title': 'Votre prochain scan est disponible dans {{time}}',
  'scan_limits.upgrade_unlimited_subtitle': 'Passez en Premium pour scanner sans limite',
};

const t = (key: string, options?: Record<string, unknown>) => {
  let value = translations[key] ?? key;

  if (options) {
    Object.entries(options).forEach(([optionKey, optionValue]) => {
      value = value.replace(`{{${optionKey}}}`, String(optionValue));
    });
  }

  return value;
};

describe('scanLimitI18n', () => {
  it('maps legacy French backend messages to dedicated i18n keys', () => {
    expect(
      resolveScanLimitMessageKey(undefined, 'Limite mensuelle atteinte. Prochain scan disponible dans')
    ).toBe('scan_limits.msg_monthly_reached_with_time');
  });

  it('formats the remaining time with localized units', () => {
    const now = Date.UTC(2026, 2, 17, 10, 0, 0);
    const nextAvailableDate = now + 6 * 24 * 60 * 60 * 1000;

    expect(formatScanLimitTime(nextAvailableDate, t, now)).toBe('6 jours');
  });

  it('builds a translated scan-limit message from message_key and interpolation', () => {
    expect(
      buildScanLimitMessage(
        {
          message: 'Limite mensuelle atteinte. Prochain scan disponible dans',
          message_key: 'scan_limits.msg_monthly_reached_with_time',
        },
        t,
        '29 jours'
      )
    ).toBe('Limite mensuelle atteinte. Prochain scan disponible dans 29 jours');
  });

  it('falls back to the raw backend message when no key can be resolved', () => {
    expect(buildScanLimitMessage({ message: 'Backend fallback' }, t, '29 jours')).toBe('Backend fallback');
  });

  it('builds translated paywall copy for the limit modal', () => {
    expect(buildScanLimitPaywallTitle(t, '6 jours')).toBe('Votre prochain scan est disponible dans 6 jours');
    expect(getScanLimitUpgradeSubtitle(t)).toBe('Passez en Premium pour scanner sans limite');
  });
});
