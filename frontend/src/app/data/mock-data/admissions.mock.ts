import {
  Admission,
  Enquiry,
  EnquiryStatus,
  FollowUp,
  FollowUpChannel,
  Lead,
  LeadSource,
  LeadStatus,
} from '../../domain/models';
import { addDays, atMinutes, diffDays } from '../../shared/utils/date.util';
import { FEE_PLANS } from './fees.mock';
import { STUDENTS } from './students.mock';
import {
  TODAY,
  chance,
  createRng,
  emailFor,
  int,
  personName,
  phoneNumber,
  pick,
  weighted,
} from './seed';

const rng = createRng(7707);

export const ADVISOR_IDS = ['EMP-003', 'EMP-004', 'EMP-005', 'EMP-019'] as const;
export const SALES_IDS = ['EMP-013', 'EMP-014', 'EMP-015', 'EMP-016'] as const;

const SOURCES: readonly (readonly [LeadSource, number])[] = [
  ['Instagram', 22],
  ['Website', 18],
  ['Google Ads', 15],
  ['Facebook', 10],
  ['Walk-in', 10],
  ['Referral', 12],
  ['WhatsApp', 8],
  ['JustDial', 5],
];

const COURSE_WEIGHTS: readonly (readonly [string, number])[] = [
  ['CRS-01', 26],
  ['CRS-02', 14],
  ['CRS-03', 13],
  ['CRS-04', 12],
  ['CRS-05', 8],
  ['CRS-06', 9],
  ['CRS-07', 7],
  ['CRS-08', 6],
  ['CRS-09', 5],
];

const LEAD_NOTES = [
  'Final year B.Tech student, looking for placement-oriented course.',
  'Working in non-IT role, wants to switch career to software.',
  'Asked about weekend batch availability.',
  'Interested in installment option; will discuss with parents.',
  'Came via Instagram reel on AI course.',
  'Referred by alumni from last FSD batch.',
  'Wants details on internship and placement support.',
  'Comparing with another institute in Kakkanad.',
  'Prefers online/hybrid mode due to distance.',
  '',
];

const ENQUIRY_REMARKS = [
  'Attended demo class, positive feedback.',
  'Parents visiting campus on Saturday.',
  'Needs clarity on EMI through finance partner.',
  'Waiting for semester results before joining.',
  'Asked for syllabus PDF and fee structure on WhatsApp.',
  'Counselling done, shortlisted Full Stack vs Python.',
  'Requested scholarship / discount details.',
  'Will join next batch if evening timing available.',
];

const PURPOSES = [
  'Share fee structure and installment plan',
  'Confirm demo class attendance',
  'Discuss course fit after counselling',
  'Remind about upcoming batch start date',
  'Clarify placement support process',
  'Collect documents for admission',
  'Follow up on parent discussion',
];

const TIMES = ['10:00', '10:30', '11:15', '12:00', '14:30', '15:15', '16:00', '17:30'];

function buildLeads(): Lead[] {
  const leads: Lead[] = [];
  for (let i = 0; i < 72; i++) {
    const gender = chance(rng, 0.55) ? 'Male' : 'Female';
    const name = personName(rng, gender);
    const age = int(rng, 0, 45);
    let status = weighted<LeadStatus>(rng, [
      ['New', 16],
      ['Contacted', 18],
      ['Follow-up', 22],
      ['Qualified', 12],
      ['Converted', 14],
      ['Lost', 10],
    ]);
    if (age <= 2) status = chance(rng, 0.7) ? 'New' : 'Contacted';
    const assignedTo = i % 5 === 0 ? pick(rng, ['EMP-003', 'EMP-004'] as const) : SALES_IDS[i % 4];
    leads.push({
      id: `LD-${2101 + i}`,
      name,
      phone: phoneNumber(rng),
      email: emailFor(rng, name),
      courseId: weighted(rng, COURSE_WEIGHTS),
      source: weighted(rng, SOURCES),
      assignedTo,
      status,
      createdOn: addDays(TODAY, -age),
      notes: pick(rng, LEAD_NOTES),
    });
  }
  return leads.sort((a, b) => b.createdOn.localeCompare(a.createdOn));
}

export const LEADS: Lead[] = buildLeads();

function buildEnquiries(): Enquiry[] {
  const fromLeads = LEADS.filter((l) =>
    ['Qualified', 'Converted', 'Follow-up'].includes(l.status),
  ).slice(0, 30);
  const enquiries: Enquiry[] = [];
  let seq = 3101;

  const push = (
    base: Omit<Enquiry, 'id' | 'status' | 'nextFollowUp' | 'remarks'>,
    leadStatus?: LeadStatus,
  ) => {
    let status = weighted<EnquiryStatus>(rng, [
      ['New', 8],
      ['Counselling', 12],
      ['Follow-up', 14],
      ['Converted', 7],
      ['Closed', 5],
    ]);
    if (leadStatus === 'Converted') status = 'Converted';
    const open = status === 'New' || status === 'Counselling' || status === 'Follow-up';
    enquiries.push({
      ...base,
      id: `ENQ-${seq++}`,
      status,
      nextFollowUp: open ? addDays(TODAY, int(rng, -3, 7)) : null,
      remarks: pick(rng, ENQUIRY_REMARKS),
    });
  };

  for (const lead of fromLeads) {
    const enquiryDate = addDays(lead.createdOn, int(rng, 0, 4));
    push(
      {
        leadId: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        courseId: lead.courseId,
        source: lead.source,
        assignedTo: pick(rng, ADVISOR_IDS),
        enquiryDate: diffDays(enquiryDate, TODAY) > 0 ? TODAY : enquiryDate,
      },
      lead.status,
    );
  }
  for (let i = 0; i < 16; i++) {
    const name = personName(rng, chance(rng, 0.5) ? 'Male' : 'Female');
    push({
      leadId: null,
      name,
      phone: phoneNumber(rng),
      email: emailFor(rng, name),
      courseId: weighted(rng, COURSE_WEIGHTS),
      source: pick(rng, ['Walk-in', 'Referral', 'Website'] as const),
      assignedTo: i < 5 ? 'EMP-003' : pick(rng, ADVISOR_IDS),
      enquiryDate: addDays(TODAY, -int(rng, 0, 20)),
    });
  }
  return enquiries.sort((a, b) => b.enquiryDate.localeCompare(a.enquiryDate));
}

export const ENQUIRIES: Enquiry[] = buildEnquiries();

function buildFollowUps(): FollowUp[] {
  const items: FollowUp[] = [];
  let seq = 4101;
  const channel = (): FollowUpChannel =>
    weighted(rng, [
      ['Call', 60],
      ['WhatsApp', 25],
      ['Visit', 10],
      ['Email', 5],
    ] as const);

  for (const enq of ENQUIRIES.filter((e) => e.nextFollowUp)) {
    items.push({
      id: `FU-${seq++}`,
      relatedType: 'Enquiry',
      relatedId: enq.id,
      name: enq.name,
      phone: enq.phone,
      courseId: enq.courseId,
      assignedTo: enq.assignedTo,
      dueDate: enq.nextFollowUp!,
      dueTime: pick(rng, TIMES),
      channel: channel(),
      purpose: pick(rng, PURPOSES),
      status: 'Pending',
      completedOn: null,
      notes: [],
    });
  }

  for (const lead of LEADS.filter((l) => l.status === 'Follow-up' || l.status === 'Contacted')) {
    const completed = lead.status === 'Contacted' && chance(rng, 0.6);
    const dueDate = completed ? addDays(TODAY, -int(rng, 1, 10)) : addDays(TODAY, int(rng, -4, 6));
    items.push({
      id: `FU-${seq++}`,
      relatedType: 'Lead',
      relatedId: lead.id,
      name: lead.name,
      phone: lead.phone,
      courseId: lead.courseId,
      assignedTo: lead.assignedTo,
      dueDate,
      dueTime: pick(rng, TIMES),
      channel: channel(),
      purpose: pick(rng, PURPOSES),
      status: completed ? 'Completed' : 'Pending',
      completedOn: completed ? dueDate : null,
      notes: completed
        ? [
            {
              text: pick(rng, ENQUIRY_REMARKS),
              at: atMinutes(dueDate, int(rng, 600, 1050)),
              by: lead.assignedTo,
            },
          ]
        : [],
    });
  }

  // Guarantee a few follow-ups due today for the demo advisor and sales users.
  const forceToday = (assignee: string, count: number) => {
    items
      .filter((f) => f.assignedTo === assignee && f.status === 'Pending')
      .slice(0, count)
      .forEach((f) => (f.dueDate = TODAY));
  };
  forceToday('EMP-003', 3);
  forceToday('EMP-013', 3);

  return items.sort((a, b) => (a.dueDate + a.dueTime).localeCompare(b.dueDate + b.dueTime));
}

export const FOLLOW_UPS: FollowUp[] = buildFollowUps();

function buildAdmissions(): Admission[] {
  const convertedLeads = LEADS.filter((l) => l.status === 'Converted');
  return STUDENTS.map((s, i): Admission => {
    const plan = FEE_PLANS.find((p) => p.studentId === s.id)!;
    const recent = diffDays(TODAY, s.admissionDate) <= 20;
    return {
      id: `ADM-${5001 + i}`,
      studentId: s.id,
      studentName: s.name,
      courseId: s.courseId,
      batchId: s.batchId,
      admissionDate: s.admissionDate,
      advisorId: s.id === 'STU-1001' ? 'EMP-003' : ADVISOR_IDS[i % ADVISOR_IDS.length],
      status:
        s.status === 'Dropped'
          ? 'Cancelled'
          : recent && chance(rng, 0.25)
            ? 'Pending Documents'
            : 'Confirmed',
      feePlan: plan.planType,
      sourceRef: convertedLeads[i]?.id ?? null,
    };
  }).sort((a, b) => b.admissionDate.localeCompare(a.admissionDate));
}

export const ADMISSIONS: Admission[] = buildAdmissions();
