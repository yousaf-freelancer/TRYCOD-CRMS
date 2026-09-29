import { CallDirection, CallLog } from '../../domain/models';
import { addDays, atMinutes, isSunday, nowMinutes } from '../../shared/utils/date.util';
import { LEADS, SALES_IDS } from './admissions.mock';
import { TODAY, chance, createRng, int, phoneNumber, pick } from './seed';

const rng = createRng(1201);

function build(): CallLog[] {
  const calls: CallLog[] = [];
  const now = Math.max(nowMinutes(), 11 * 60);
  let seq = 1;

  for (let offset = 30; offset >= 0; offset--) {
    const date = addDays(TODAY, -offset);
    if (isSunday(date)) continue;
    for (const salesId of SALES_IDS) {
      const myLeads = LEADS.filter((l) => l.assignedTo === salesId);
      const count = int(rng, 7, 15);
      const end = date === TODAY ? Math.min(now, 18 * 60) : 18 * 60;
      for (let i = 0; i < count; i++) {
        const minute = int(rng, 9 * 60 + 30, end);
        const direction: CallDirection = chance(rng, 0.64) ? 'Outgoing' : 'Incoming';
        const answered = chance(rng, direction === 'Outgoing' ? 0.72 : 0.86);
        const lead = myLeads.length && chance(rng, 0.5) ? pick(rng, myLeads) : null;
        calls.push({
          id: `CL-${seq++}`,
          at: atMinutes(date, minute),
          salespersonId: salesId,
          phone: lead?.phone ?? phoneNumber(rng),
          leadId: lead?.id ?? null,
          leadName: lead?.name ?? null,
          direction,
          status: answered ? 'Answered' : 'Missed',
          durationSec: answered ? int(rng, 25, 560) : 0,
        });
      }
    }
  }
  return calls.sort((a, b) => b.at.localeCompare(a.at));
}

export const CALL_LOGS: CallLog[] = build();
