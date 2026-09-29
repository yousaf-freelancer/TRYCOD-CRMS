import { Gender, GuardianRelation, Student, StudentDocument } from '../../domain/models';
import { addDays, diffDays } from '../../shared/utils/date.util';
import { BATCHES } from './courses.mock';
import {
  CITIES,
  LOCALITIES,
  MALE_NAMES,
  OCCUPATIONS,
  QUALIFICATIONS,
  TODAY,
  chance,
  createRng,
  emailFor,
  int,
  personName,
  phoneNumber,
  pick,
} from './seed';

const rng = createRng(20260901);

/** Number of students generated per batch. */
const BATCH_SIZES: Record<string, number> = {
  'BAT-01': 26,
  'BAT-02': 22,
  'BAT-03': 18,
  'BAT-04': 17,
  'BAT-05': 14,
  'BAT-06': 12,
  'BAT-07': 13,
  'BAT-08': 16,
  'BAT-09': 12,
  'BAT-10': 11,
  'BAT-11': 9,
  'BAT-12': 6,
  'BAT-13': 10,
  'BAT-14': 8,
};

function guardianFor(studentName: string): Student['guardian'] {
  const surname = studentName.split(' ').slice(-1)[0];
  const relation: GuardianRelation = pick(rng, [
    'Father',
    'Father',
    'Father',
    'Mother',
    'Guardian',
  ] as const);
  const guardianFirst =
    relation === 'Mother'
      ? pick(rng, [
          'Latha',
          'Sheeba',
          'Beena',
          'Suja',
          'Rasiya',
          'Mini',
          'Bindu',
          'Jaseena',
        ] as const)
      : pick(rng, MALE_NAMES);
  return {
    name: `${guardianFirst} ${surname}`,
    relation,
    phone: phoneNumber(rng),
    occupation: pick(rng, OCCUPATIONS),
  };
}

function buildStudents(): Student[] {
  const students: Student[] = [];
  let seq = 1001;

  for (const batch of BATCHES) {
    const size = BATCH_SIZES[batch.id] ?? 10;
    for (let i = 0; i < size; i++) {
      const gender: Gender = seq === 1001 || chance(rng, 0.52) ? 'Male' : 'Female';
      let name = personName(rng, gender);
      if (seq === 1001) name = 'Adithya Raj';
      const admissionDate =
        batch.status === 'Upcoming'
          ? addDays(TODAY, -int(rng, 1, 18))
          : addDays(batch.startDate, -int(rng, 2, 24));
      let status: Student['status'] = 'Active';
      if (batch.status === 'Completed') status = chance(rng, 0.9) ? 'Completed' : 'Dropped';
      else if (batch.status === 'Ongoing' && seq !== 1001 && chance(rng, 0.04)) status = 'Dropped';

      const city = pick(rng, CITIES);
      students.push({
        id: `STU-${seq}`,
        name,
        gender,
        dob: addDays('2003-06-15', int(rng, -1500, 900)),
        phone: phoneNumber(rng),
        email: seq === 1001 ? 'student@trycod-demo.com' : emailFor(rng, name),
        address: `${int(rng, 1, 48)}/${int(rng, 100, 900)}, ${pick(rng, LOCALITIES)}`,
        city,
        qualification: pick(rng, QUALIFICATIONS),
        guardian: guardianFor(name),
        courseId: batch.courseId,
        batchId: batch.id,
        admissionDate: diffDays(admissionDate, TODAY) > 0 ? TODAY : admissionDate,
        status,
      });
      seq++;
    }
  }
  return students;
}

export const STUDENTS: Student[] = buildStudents();

/** Demo documents for a student (generated on request). */
export function documentsFor(student: Student): StudentDocument[] {
  const slug = student.name.toLowerCase().replace(/\s+/g, '_');
  const base: Omit<StudentDocument, 'id' | 'studentId'>[] = [
    {
      name: 'Aadhaar Card',
      type: 'ID Proof',
      fileName: `${slug}_aadhaar.pdf`,
      sizeKb: 412,
      uploadedOn: student.admissionDate,
      verified: true,
    },
    {
      name: 'Passport Size Photo',
      type: 'Photo',
      fileName: `${slug}_photo.jpg`,
      sizeKb: 186,
      uploadedOn: student.admissionDate,
      verified: true,
    },
    {
      name: 'Highest Qualification Certificate',
      type: 'Certificate',
      fileName: `${slug}_degree.pdf`,
      sizeKb: 1240,
      uploadedOn: addDays(student.admissionDate, 2),
      verified: student.status !== 'Dropped',
    },
    {
      name: 'Admission Agreement (signed)',
      type: 'Agreement',
      fileName: `${slug}_agreement.pdf`,
      sizeKb: 356,
      uploadedOn: addDays(student.admissionDate, 1),
      verified: true,
    },
  ];
  if (student.id.endsWith('3') || student.id.endsWith('7')) {
    base.push({
      name: 'SSLC Certificate',
      type: 'Certificate',
      fileName: `${slug}_sslc.pdf`,
      sizeKb: 890,
      uploadedOn: addDays(student.admissionDate, 3),
      verified: false,
    });
  }
  return base.map((d, i) => ({ ...d, id: `${student.id}-DOC-${i + 1}`, studentId: student.id }));
}
