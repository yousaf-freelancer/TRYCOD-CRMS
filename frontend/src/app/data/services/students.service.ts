import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { feeAccount, studentAttendanceIndex } from '../mock/derive';
import { MockDb } from '../mock/mock-db';
import { mockCompute } from '../mock/mock-response';
import { documentsFor } from '../mock-data';
import {
  DocumentType,
  Student,
  StudentDocument,
  StudentFilters,
  StudentInput,
  StudentListItem,
} from '../../domain/models';
import { todayIso } from '../../shared/utils/date.util';

/** Students. Later: `GET /api/students?courseId=&batchId=…`, `GET /api/students/:id`, etc. */
@Injectable({ providedIn: 'root' })
export class StudentsService {
  private readonly db = inject(MockDb);
  private readonly uploads = new Map<string, StudentDocument[]>();

  getStudents(filters: StudentFilters = {}): Observable<StudentListItem[]> {
    return mockCompute(() => {
      const attendance = studentAttendanceIndex(this.db);
      return this.db.students
        .filter(
          (s) =>
            (!filters.courseId || s.courseId === filters.courseId) &&
            (!filters.batchId || s.batchId === filters.batchId) &&
            (!filters.status || s.status === filters.status) &&
            (!filters.mentorId || this.db.batch(s.batchId)?.mentorId === filters.mentorId),
        )
        .map((s) => this.toListItem(s, attendance.get(s.id)?.pct ?? 0));
    });
  }

  getStudent(id: string): Observable<StudentListItem | null> {
    return mockCompute(() => {
      const student = this.db.student(id);
      if (!student) return null;
      return this.toListItem(student, studentAttendanceIndex(this.db).get(id)?.pct ?? 0);
    });
  }

  createStudent(input: StudentInput): Observable<Student> {
    return mockCompute(() => {
      const student: Student = { ...input, id: this.db.nextId('STU', this.db.students) };
      this.db.students.push(student);
      const course = this.db.course(input.courseId)!;
      this.db.feePlans.push({
        studentId: student.id,
        courseId: course.id,
        planType: 'Full',
        totalFee: course.fee,
        discount: 0,
        installments: [
          {
            id: `${student.id}-I1`,
            studentId: student.id,
            number: 1,
            dueDate: input.admissionDate,
            amount: course.fee,
            paidAmount: 0,
          },
        ],
      });
      return student;
    });
  }

  updateStudent(id: string, input: StudentInput): Observable<Student> {
    return mockCompute(() => {
      const student = this.db.student(id)!;
      Object.assign(student, input);
      return student;
    });
  }

  deleteStudent(id: string): Observable<void> {
    return mockCompute(() => {
      const idx = this.db.students.findIndex((s) => s.id === id);
      if (idx >= 0) this.db.students.splice(idx, 1);
    });
  }

  getDocuments(studentId: string): Observable<StudentDocument[]> {
    return mockCompute(() => {
      const student = this.db.student(studentId);
      return student ? [...documentsFor(student), ...(this.uploads.get(studentId) ?? [])] : [];
    });
  }

  uploadDocument(
    studentId: string,
    name: string,
    type: DocumentType,
    fileName: string,
    sizeKb: number,
  ): Observable<StudentDocument> {
    return mockCompute(() => {
      const list = this.uploads.get(studentId) ?? [];
      const doc: StudentDocument = {
        id: `${studentId}-UP-${list.length + 1}`,
        studentId,
        name,
        type,
        fileName,
        sizeKb,
        uploadedOn: todayIso(),
        verified: false,
      };
      this.uploads.set(studentId, [...list, doc]);
      return doc;
    }, 700);
  }

  private toListItem(s: Student, attendancePct: number): StudentListItem {
    const batch = this.db.batch(s.batchId);
    const account = feeAccount(this.db, s.id);
    return {
      ...s,
      courseName: this.db.courseName(s.courseId),
      batchCode: batch?.code ?? '—',
      mentorId: batch?.mentorId ?? '',
      mentorName: this.db.employeeName(batch?.mentorId),
      attendancePct,
      feeStatus: account?.status ?? 'Partial',
      balance: account?.balance ?? 0,
    };
  }
}
