import { LeaveRequest, LeaveType } from '../../domain/models';
import { addDays, atMinutes, isSunday } from '../../shared/utils/date.util';
import { EMPLOYEES } from './employees.mock';
import { TODAY, chance, createRng, int, pick } from './seed';

const rng = createRng(3301);

export const LEAVE_TYPES: LeaveType[] = [
  {
    id: 'LT-CL',
    code: 'CL',
    name: 'Casual Leave',
    annualQuota: 12,
    paid: true,
    carryForward: false,
    description: 'Short personal needs; max 3 consecutive days.',
  },
  {
    id: 'LT-SL',
    code: 'SL',
    name: 'Sick Leave',
    annualQuota: 10,
    paid: true,
    carryForward: false,
    description: 'Medical certificate required beyond 2 days.',
  },
  {
    id: 'LT-EL',
    code: 'EL',
    name: 'Earned Leave',
    annualQuota: 15,
    paid: true,
    carryForward: true,
    description: 'Planned leave; apply 7 days in advance.',
  },
  {
    id: 'LT-CO',
    code: 'CO',
    name: 'Compensatory Off',
    annualQuota: 6,
    paid: true,
    carryForward: false,
    description: 'For weekend batches or event duty.',
  },
  {
    id: 'LT-LOP',
    code: 'LOP',
    name: 'Loss of Pay',
    annualQuota: 0,
    paid: false,
    carryForward: false,
    description: 'Unpaid leave when balance is exhausted.',
  },
];

const REASONS: Record<string, string[]> = {
  'LT-CL': [
    'Family function at hometown',
    'Personal work at bank',
    "Attending a relative's wedding",
    'House shifting',
  ],
  'LT-SL': ['Fever and cold', 'Viral fever, doctor advised rest', 'Dental procedure', 'Migraine'],
  'LT-EL': [
    'Family trip to Munnar',
    'Onam vacation with family',
    'Travelling to Bengaluru for personal work',
  ],
  'LT-CO': ['Comp off for weekend orientation session', 'Comp off for Saturday placement drive'],
  'LT-LOP': ['Extended personal emergency'],
};

export function countLeaveDays(from: string, to: string, halfDay: boolean): number {
  if (halfDay) return 0.5;
  let days = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) if (!isSunday(d)) days++;
  return days;
}

function request(
  seq: number,
  employeeId: string,
  leaveTypeId: string,
  from: string,
  to: string,
  status: LeaveRequest['status'],
  halfDay = false,
): LeaveRequest {
  const decided = status === 'Approved' || status === 'Rejected';
  let applied = addDays(from, -int(rng, 2, 9));
  if (applied > TODAY) applied = addDays(TODAY, -int(rng, 0, 2));
  const decidedOn = addDays(applied, 1) > TODAY ? TODAY : addDays(applied, 1);
  return {
    id: `LV-${seq}`,
    employeeId,
    leaveTypeId,
    from,
    to,
    days: countLeaveDays(from, to, halfDay),
    halfDay,
    reason: pick(rng, REASONS[leaveTypeId]),
    status,
    appliedOn: atMinutes(applied, int(rng, 560, 1080)),
    decidedBy: decided ? 'EMP-002' : null,
    decidedOn: decided ? decidedOn : null,
    decisionNote: status === 'Rejected' ? 'Batch schedule clash; please reschedule.' : '',
  };
}

/** Today, or Saturday when today is Sunday (so "on leave today" is never a holiday). */
const WORKDAY = isSunday(TODAY) ? addDays(TODAY, -1) : TODAY;

function build(): LeaveRequest[] {
  let seq = 801;
  const list: LeaveRequest[] = [
    // On leave today
    request(seq++, 'EMP-010', 'LT-SL', addDays(TODAY, -1), addDays(TODAY, 1), 'Approved'),
    request(seq++, 'EMP-015', 'LT-CL', WORKDAY, WORKDAY, 'Approved'),
    // Pending approvals
    request(seq++, 'EMP-008', 'LT-CL', addDays(TODAY, 5), addDays(TODAY, 6), 'Pending'),
    request(seq++, 'EMP-014', 'LT-EL', addDays(TODAY, 12), addDays(TODAY, 16), 'Pending'),
    request(seq++, 'EMP-004', 'LT-SL', addDays(TODAY, 1), addDays(TODAY, 1), 'Pending', true),
    request(seq++, 'EMP-012', 'LT-CL', addDays(TODAY, 3), addDays(TODAY, 3), 'Pending'),
    request(seq++, 'EMP-006', 'LT-EL', addDays(TODAY, 20), addDays(TODAY, 22), 'Pending'),
  ];

  const active = EMPLOYEES.filter((e) => e.status === 'Active');
  for (let i = 0; i < 26; i++) {
    const emp = i < 3 ? EMPLOYEES[[2, 12, 5][i]] : pick(rng, active);
    const type = pick(rng, ['LT-CL', 'LT-CL', 'LT-SL', 'LT-SL', 'LT-EL', 'LT-CO'] as const);
    let from = addDays(TODAY, -int(rng, 6, 88));
    if (isSunday(from)) from = addDays(from, 1);
    const length = type === 'LT-EL' ? int(rng, 2, 4) : int(rng, 0, 1);
    const status = chance(rng, 0.1) ? 'Rejected' : 'Approved';
    list.push(
      request(
        seq++,
        emp.id,
        type,
        from,
        addDays(from, length),
        status,
        type === 'LT-CL' && chance(rng, 0.15),
      ),
    );
  }
  list.push(
    request(seq++, 'EMP-013', 'LT-CL', addDays(TODAY, -30), addDays(TODAY, -30), 'Cancelled'),
  );
  return list.sort((a, b) => b.appliedOn.localeCompare(a.appliedOn));
}

export const LEAVE_REQUESTS: LeaveRequest[] = build();
