export const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires';
export function localParts(date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: ARGENTINA_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date).map(part => [part.type, part.value]));
  const dateStr = `${parts.year}-${parts.month}-${parts.day}`;
  return { date: dateStr, time: `${parts.hour}:${parts.minute}`, day: new Date(`${dateStr}T12:00:00-03:00`).getUTCDay() };
}
export function validateBookingConfig(config) {
  const validTime = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  if (!Array.isArray(config.workDays) || !config.workDays.length || config.workDays.some(day => !Number.isInteger(day) || day < 0 || day > 6) ||
      !validTime(config.openTime) || !validTime(config.closeTime) || config.openTime >= config.closeTime ||
      !Number.isInteger(config.durationMin) || config.durationMin < 5 || config.durationMin > 480 ||
      !Number.isFinite(config.minAdvanceHours) || config.minAdvanceHours < 0 || config.minAdvanceHours > 720 ||
      !Number.isInteger(config.maxConcurrent) || config.maxConcurrent < 1 || config.maxConcurrent > 100 ||
      !Array.isArray(config.blockedDates) || config.blockedDates.some(date => !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
    throw new Error('Los horarios, días y límites de la agenda no son válidos.');
  }
  return config;
}
export function validateAppointment(dateTime, appointments, config, now = new Date()) {
  validateBookingConfig(config);
  if (typeof dateTime !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateTime)) throw new Error('Usá una fecha y hora válidas.');
  const instant = new Date(`${dateTime}:00-03:00`);
  if (!Number.isFinite(instant.getTime())) throw new Error('Fecha inválida.');
  const parts = localParts(instant);
  if (`${parts.date}T${parts.time}` !== dateTime || !config.workDays.includes(parts.day) || config.blockedDates.includes(parts.date)) throw new Error('El día elegido no está disponible.');
  const start = Number(parts.time.slice(0, 2)) * 60 + Number(parts.time.slice(3));
  const end = Number(config.closeTime.slice(0, 2)) * 60 + Number(config.closeTime.slice(3));
  if (parts.time < config.openTime || start + config.durationMin > end || instant.getTime() < now.getTime() + config.minAdvanceHours * 3600000) throw new Error('El horario elegido no está disponible.');
  const overlaps = appointments.filter(item => {
    const from = new Date(`${item.dateTime}:00-03:00`).getTime();
    return from < instant.getTime() + config.durationMin * 60000 && from + (item.durationMin || config.durationMin) * 60000 > instant.getTime();
  });
  if (overlaps.length >= config.maxConcurrent) throw new Error('Ese horario ya está reservado. Elegí otro.');
  return instant;
}
