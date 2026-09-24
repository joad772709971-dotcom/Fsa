import { DayRecord } from '../types';
import { DAYS_1_TO_10 } from './daysData1to10';
import { DAYS_11_TO_20 } from './daysData11to20';
import { DAYS_21_TO_25 } from './daysData21to25';
import { daysData26to30 } from './daysData26to30';
import { applyOfficialHadiToDayRecords } from './hadiOfficialRecords';

const BASE_DAYS: DayRecord[] = [
  ...DAYS_1_TO_10,
  ...DAYS_11_TO_20,
  ...DAYS_21_TO_25,
  ...daysData26to30
];

export const INITIAL_DAYS_DATA: DayRecord[] = applyOfficialHadiToDayRecords(BASE_DAYS);

export const initialDaysRecord = INITIAL_DAYS_DATA;


