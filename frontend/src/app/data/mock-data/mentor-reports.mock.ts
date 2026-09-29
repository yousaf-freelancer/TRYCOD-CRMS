import { MentorReport } from '../../domain/models';
import { addDays, atMinutes, startOfWeek } from '../../shared/utils/date.util';
import { BATCHES } from './courses.mock';
import { TODAY, chance, createRng, int, pick, weighted } from './seed';
import { STUDENTS } from './students.mock';

const rng = createRng(6601);

const STRENGTHS = [
  'Strong grasp of fundamentals; completes assignments on time.',
  'Good problem-solving approach in lab sessions.',
  'Actively asks questions and helps peers.',
  'Clean, readable code with good naming.',
  'Quick learner — picked up the new framework concepts fast.',
  'Consistent with daily practice on the LMS.',
  'Presented the mini project confidently.',
  'Good understanding of data structures used in the module.',
];

const IMPROVEMENTS = [
  'Needs more practice with async programming.',
  'Should focus on writing test cases.',
  'Git workflow needs improvement (branching, PRs).',
  'Revise SQL joins and aggregations.',
  'Improve time management during coding assessments.',
  'Needs to complete pending assignments from last week.',
  'Work on communication during stand-ups.',
  'Should practise debugging without step-by-step help.',
];

const REMARKS = [
  'On track for the module assessment.',
  'Recommend extra lab hours on Saturday.',
  'Discussed progress with student; agreed on weekly goals.',
  'Ready for the mini project phase.',
  'Parent informed about attendance.',
  'Good week overall.',
];

const ATTENDANCE_REMARKS = [
  'Regular',
  'Regular',
  'Regular',
  'Late twice this week',
  'Missed one session',
  'Irregular — follow up',
];

/** Batches whose most recent week is still pending (for the "pending reports" demo). */
const PENDING_LAST_WEEK = new Set(['BAT-01', 'BAT-02', 'BAT-05', 'BAT-09']);

function build(): MentorReport[] {
  const reports: MentorReport[] = [];
  const lastWeek = addDays(startOfWeek(TODAY), -7);
  const firstWeek = addDays(lastWeek, -35);
  let seq = 1;

  for (const batch of BATCHES.filter((b) => b.status === 'Ongoing')) {
    const students = STUDENTS.filter((s) => s.batchId === batch.id && s.status === 'Active');
    const batchFirst =
      startOfWeek(batch.startDate) > firstWeek
        ? addDays(startOfWeek(batch.startDate), 7)
        : firstWeek;

    for (let week = batchFirst; week <= lastWeek; week = addDays(week, 7)) {
      const skipAll = week === lastWeek && PENDING_LAST_WEEK.has(batch.id);
      const halfOnly = week === lastWeek && batch.id === 'BAT-04';
      students.forEach((student, idx) => {
        if (skipAll || (halfOnly && idx % 2 === 0)) return;
        const rating = weighted(rng, [
          [5, 18],
          [4, 40],
          [3, 30],
          [2, 10],
          [1, 2],
        ] as const);
        reports.push({
          id: `MR-${seq++}`,
          studentId: student.id,
          batchId: batch.id,
          mentorId: batch.mentorId,
          weekStart: week,
          progressRating: rating,
          attendanceRemark: rating <= 2 ? 'Irregular — follow up' : pick(rng, ATTENDANCE_REMARKS),
          strengths: pick(rng, STRENGTHS),
          improvements: pick(rng, IMPROVEMENTS),
          remarks: chance(rng, 0.8) ? pick(rng, REMARKS) : '',
          submittedAt: atMinutes(addDays(week, int(rng, 5, 7)), int(rng, 960, 1140)),
        });
      });
    }
  }
  return reports;
}

export const MENTOR_REPORTS: MentorReport[] = build();
