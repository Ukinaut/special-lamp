import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ALWAYS_ACTIVE_PHONE_NUMBERS,
  ALWAYS_PAUSED_PHONE_NUMBERS,
  isAlwaysActivePhone,
  isAlwaysPausedPhone,
  shouldPausePhone
} from '../always-paused-phones.js';

describe('Always-paused phone numbers', () => {
  it('configures all supplied numbers and normalizes them before matching', () => {
    assert.deepEqual(ALWAYS_PAUSED_PHONE_NUMBERS, [
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
    assert.equal(isAlwaysPausedPhone('+54 9 11 4164 0955'), true);
    assert.equal(isAlwaysPausedPhone('+54 9 11 5880 6191'), true);
    assert.equal(isAlwaysPausedPhone('+54 9 11 6300 5133'), true);
    assert.equal(isAlwaysPausedPhone('+54 9 11 3603 6492'), true);
    assert.equal(isAlwaysPausedPhone('+54 9 11 7363 7174'), true);
    assert.equal(isAlwaysPausedPhone('+54 9 387 2127974'), true);
    assert.equal(isAlwaysPausedPhone('+54 9 3875 014000'), true);
    assert.equal(isAlwaysPausedPhone('+54 9 11 7358 3768'), true);
    assert.equal(isAlwaysPausedPhone('+54 9 11 6230 0000'), true);
    assert.equal(isAlwaysPausedPhone('+54 9 297 4381074'), true);
    assert.equal(isAlwaysPausedPhone('+54 362 437 1263'), true);
    assert.equal(isAlwaysPausedPhone('+54 9 362 437 1263'), true);
    assert.equal(isAlwaysPausedPhone('+54 362 481 1153'), true);
    assert.equal(isAlwaysPausedPhone('+54 9 362 481 1153'), true);
    assert.equal(isAlwaysPausedPhone('5491141640955@s.whatsapp.net'), true);
    assert.equal(isAlwaysPausedPhone('+54 9 11 4164 0956'), false);
  });

  it('keeps the test phone active and unaffected by pause requests', () => {
    assert.deepEqual(ALWAYS_ACTIVE_PHONE_NUMBERS, ['5491123159656']);
    assert.equal(ALWAYS_PAUSED_PHONE_NUMBERS.some(isAlwaysActivePhone), false);
    assert.equal(isAlwaysActivePhone('+54 9 11 2315 9656'), true);
    assert.equal(shouldPausePhone('+54 9 11 2315 9656', true), false);
    assert.equal(shouldPausePhone('+54 9 11 2315 9656', false), false);
    assert.equal(isAlwaysPausedPhone('+54 9 11 2315 9656'), false);
  });

  it('keeps configured permanent-pause numbers paused unless removed', () => {
    assert.equal(shouldPausePhone('+54 9 11 4164 0955', false), true);
    assert.equal(shouldPausePhone('+54 9 11 4164 0955', true), true);
    assert.equal(shouldPausePhone('+54 9 11 4164 0956', false), false);
  });
});
