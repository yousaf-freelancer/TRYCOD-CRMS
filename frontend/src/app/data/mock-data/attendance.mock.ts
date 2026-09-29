import {
  AttendanceStatus,
  StaffAttendance,
  StaffAttendanceStatus,
  StudentAttendance,
} from '../../domain/models';
import { addDays, hmFromMinutes, isSunday, nowMinutes } from '../../shared/utils/date.util';
import { BATCHES } from './courses.mock';
import { EMPLOYEES } from './employees.mock';
import { LEAVE_REQUESTS } from './leave.mock';
import { TODAY, chance, createRng, int } from './seed';
import { STUDENTS } from './students.mock';

const HISTORY_DAYS = 100;

/** Batches whose classroom uses the (future) biometric device. */
const DEVICE_BATCHES = new Set(['BAT-01', 'BAT-03', 'BAT-10']);

function isMorningBatch(timing: string): boolean {
  return timing.includes('AM –');
}

function buildStudentAttendance(): StudentAttendance[] {
  const rng = createRng(9901);
  const records: StudentAttendance[] = [];
  let seq = 1;

  for (const batch of BATCHES.filter((b) => b.status === 'Ongoing')) {
    const students = STUDENTS.filter((s) => s.batchId === batch.id && s.status === 'Active');
    const reliability = new Map(
      students.map((s) => [
        s.id,
        s.id === 'STU-1001' ? 0.9 : chance(rng, 0.1) ? 0.62 + rng() * 0.1 : 0.8 + rng() * 0.18,
      ]),
    );
    const start =
      batch.startDate > addDays(TODAY, -HISTORY_DAYS)
        ? batch.startDate
        : addDays(TODAY, -HISTORY_DAYS);
    const lastDay = isMorningBatch(batch.timing) ? TODAY : addDays(TODAY, -1);

    for (let date = start; date <= lastDay; date = addDays(date, 1)) {
      if (isSunday(date)) continue;
      for (const student of students) {
        const r = reliability.get(student.id)!;
        let status: AttendanceStatus = rng() < r ? 'Present' : 'Absent';
        if (status === 'Present' && chance(rng, 0.07)) status = 'Late';
        records.push({
          id: `SA-${seq++}`,
          studentId: student.id,
          batchId: batch.id,
          date,
          status,
          source: DEVICE_BATCHES.has(batch.id) ? 'Device' : 'Manual',
          markedBy: batch.mentorId,
        });
      }
    }
  }
  return records;
}

function buildStaffAttendance(): StaffAttendance[] {
  const rng = createRng(5501);
  const records: StaffAttendance[] = [];
  const approvedLeaves = LEAVE_REQUESTS.filter((l) => l.status === 'Approved');
  const now = nowMinutes();
  let seq = 1;

  for (const emp of EMPLOYEES.filter((e) => e.status === 'Active')) {
    for (let date = addDays(TODAY, -HISTORY_DAYS); date <= TODAY; date = addDays(date, 1)) {
      if (isSunday(date) || date < emp.joiningDate) continue;
      const onLeave = approvedLeaves.some(
        (l) => l.employeeId === emp.id && date >= l.from && date <= l.to && !l.halfDay,
      );
      let status: StaffAttendanceStatus;
      let checkIn: number | null = null;
      let checkOut: number | null = null;

      if (onLeave) {
        status = 'On Leave';
      } else {
        const roll = rng();
        if (roll < 0.022) status = 'Absent';
        else if (roll < 0.05) status = 'Half Day';
        else if (roll < 0.14) status = 'Late';
        else status = 'Present';

        if (status !== 'Absent') {
          checkIn = status === 'Late' ? int(rng, 582, 640) : int(rng, 552, 578);
          checkOut = status === 'Half Day' ? checkIn + int(rng, 200, 235) : int(rng, 1062, 1112);
        }
      }

      if (date === TODAY && checkOut !== null && checkOut > now) checkOut = null;

      records.push({
        id: `ST-${seq++}`,
        employeeId: emp.id,
        date,
        checkIn: checkIn === null ? null : hmFromMinutes(checkIn),
        checkOut: checkOut === null ? null : hmFromMinutes(checkOut),
        status,
        source: status === 'On Leave' ? 'Manual' : chance(rng, 0.75) ? 'Device' : 'Manual',
      });
    }
  }
  return records;
}

export const STUDENT_ATTENDANCE: StudentAttendance[] = buildStudentAttendance();
export const STAFF_ATTENDANCE: StaffAttendance[] = buildStaffAttendance();
