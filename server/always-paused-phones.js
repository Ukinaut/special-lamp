export const ALWAYS_PAUSED_PHONE_NUMBERS = Object.freeze([
  '5491141640955',
  '5491158806191',
  '5491163005133',
  '5491136036492',
  '5491173637174',
  '5493872127974',
  '5493875014000',
  '5491173583768',
  '5491162300000',
  '5492974381074',
  '5493624371263',
  '5493624811153'
]);

export const ALWAYS_ACTIVE_PHONE_NUMBERS = Object.freeze([
  '5491123159656'
]);

function normalizePhoneDigits(phone) {
  let phoneDigits = String(phone || '').replace(/\D/g, '');
  if (phoneDigits.startsWith('54') && !phoneDigits.startsWith('549') && phoneDigits.length === 12) {
    phoneDigits = `549${phoneDigits.slice(2)}`;
  }
  return phoneDigits;
}

const alwaysPausedPhoneDigits = new Set(ALWAYS_PAUSED_PHONE_NUMBERS.map(normalizePhoneDigits));
const alwaysActivePhoneDigits = new Set(ALWAYS_ACTIVE_PHONE_NUMBERS.map(normalizePhoneDigits));

export function isAlwaysPausedPhone(phone) {
  return alwaysPausedPhoneDigits.has(normalizePhoneDigits(phone));
}

export function isAlwaysActivePhone(phone) {
  return alwaysActivePhoneDigits.has(normalizePhoneDigits(phone));
}

export function shouldPausePhone(phone, pauseRequested) {
  if (isAlwaysActivePhone(phone)) return false;
  return pauseRequested || isAlwaysPausedPhone(phone);
}
