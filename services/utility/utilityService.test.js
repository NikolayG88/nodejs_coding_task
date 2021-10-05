import regeneratorRuntime from 'regenerator-runtime';

import UtilityService from "./utilityService";

let util;
const testDate = new Date('10/5/2021');
const testDateTuesdayDoY = 277;
const testDateMondayDoY = 276;
const testDateSundayDoY = 282;

beforeAll(() => {
  util = new UtilityService();
});

test('get day of year', async () => {
  const dayRes = util.toDayOfYear(testDate);

  expect(dayRes).toBe(testDateTuesdayDoY);
});

test('get moday day of year', async () => {
  const dayRes = util.getMondayDayOfYear(testDate);

  expect(dayRes).toBe(testDateMondayDoY);
});

test('get sunday day of year', async () => {
  const dayRes = util.getSundayDayOfYear(testDate);

  expect(dayRes).toBe(testDateSundayDoY);
});

test('round currency', async () => {
  const roundRes = util.roundCurrency(0.023446456456);

  expect(roundRes).toBe(0.03);
});