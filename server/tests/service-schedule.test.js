import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getWeekendPeriodKey } from '../service-schedule.js';

describe('Bot weekday availability', () => {
  it('returns no weekend period from Monday through Friday in Argentina time', () => {
    for (const date of [
      '2026-10-05T15:00:00.000Z',
      '2026-10-06T15:00:00.000Z',
      '2026-10-07T15:00:00.000Z',
      '2026-10-08T15:00:00.000Z',
      '2026-10-09T15:00:00.000Z'
    ]) {
      assert.equal(getWeekendPeriodKey(new Date(date)), null);
    }
  });

  it('uses the same weekend period for Saturday and Sunday in Argentina time', () => {
    assert.equal(getWeekendPeriodKey(new Date('2026-10-03T15:00:00.000Z')), '2026-10-03');
    assert.equal(getWeekendPeriodKey(new Date('2026-10-04T15:00:00.000Z')), '2026-10-03');
  });

  it('determines the service day using Argentina local time around midnight UTC', () => {
    assert.equal(getWeekendPeriodKey(new Date('2026-10-03T02:30:00.000Z')), null);
    assert.equal(getWeekendPeriodKey(new Date('2026-10-05T02:30:00.000Z')), '2026-10-03');
  });
});
