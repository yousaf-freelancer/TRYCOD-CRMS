import { MonthKey, PayrollStatus } from '../../domain/models';
import { addMonthKey, lastMonthKeys } from '../../shared/utils/date.util';

export interface PayrollRunState {
  month: MonthKey;
  status: PayrollStatus;
  processedOn: string | null;
}

/** Last six months are processed; the current month is still a draft. */
export const PAYROLL_RUNS: PayrollRunState[] = lastMonthKeys(7).map((month, i, all) => {
  const isCurrent = i === all.length - 1;
  return {
    month,
    status: isCurrent ? 'Draft' : 'Processed',
    processedOn: isCurrent ? null : `${addMonthKey(month, 1)}-01`,
  };
});
