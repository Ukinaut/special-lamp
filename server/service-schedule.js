const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires';

export function getWeekendPeriodKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ARGENTINA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const { year, month, day } = dateParts;
  const weekday = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).getUTCDay();

  if (weekday !== 0 && weekday !== 6) return null;

  const saturday = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) - (weekday === 0 ? 1 : 0)));
  return saturday.toISOString().slice(0, 10);
}

export const WEEKEND_UNAVAILABLE_MESSAGE =
  'Gracias por comunicarte con AITUE. El bot no está disponible durante el fin de semana; volverá a estar disponible el lunes. Por favor, escribinos ese día para continuar.';
