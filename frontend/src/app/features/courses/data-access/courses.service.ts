import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MockDb } from '../../../core/mock/mock-db';
import { mockCompute, mockError } from '../../../core/mock/mock-response';
import { Batch, BatchInput, BatchStatus, BatchView, Course, CourseInput } from '../../../models';

export interface BatchFilters {
  courseId?: string | null;
  mentorId?: string | null;
  status?: BatchStatus | null;
}

/** Courses & batches. Later: `GET/POST/PATCH/DELETE /api/courses`, `/api/batches`. */
@Injectable({ providedIn: 'root' })
export class CoursesService {
  private readonly db = inject(MockDb);

  getCourses(): Observable<Course[]> {
    return mockCompute(() => [...this.db.courses]);
  }

  createCourse(input: CourseInput): Observable<Course> {
    return mockCompute(() => {
      const course: Course = { ...input, id: this.db.nextId('CRS', this.db.courses) };
      this.db.courses.push(course);
      return course;
    });
  }

  updateCourse(id: string, input: CourseInput): Observable<Course> {
    return mockCompute(() => {
      const course = this.db.course(id)!;
      Object.assign(course, input);
      return course;
    });
  }

  deleteCourse(id: string): Observable<void> {
    if (this.db.batches.some((b) => b.courseId === id)) {
      return mockError('This course has batches. Mark it inactive instead of deleting it.');
    }
    return mockCompute(() => {
      this.db.courses.splice(
        this.db.courses.findIndex((c) => c.id === id),
        1,
      );
    });
  }

  getBatches(filters: BatchFilters = {}): Observable<BatchView[]> {
    return mockCompute(() =>
      this.db.batches
        .filter(
          (b) =>
            (!filters.courseId || b.courseId === filters.courseId) &&
            (!filters.mentorId || b.mentorId === filters.mentorId) &&
            (!filters.status || b.status === filters.status),
        )
        .map((b) => this.toView(b))
        .sort(
          (a, b) =>
            statusOrder(a.status) - statusOrder(b.status) || b.startDate.localeCompare(a.startDate),
        ),
    );
  }

  createBatch(input: BatchInput): Observable<BatchView> {
    return mockCompute(() => {
      const batch: Batch = { ...input, id: this.db.nextId('BAT', this.db.batches) };
      this.db.batches.push(batch);
      return this.toView(batch);
    });
  }

  updateBatch(id: string, input: BatchInput): Observable<BatchView> {
    return mockCompute(() => {
      const batch = this.db.batch(id)!;
      Object.assign(batch, input);
      return this.toView(batch);
    });
  }

  deleteBatch(id: string): Observable<void> {
    if (this.db.students.some((s) => s.batchId === id)) {
      return mockError('Students are enrolled in this batch. Move them before deleting it.');
    }
    return mockCompute(() => {
      this.db.batches.splice(
        this.db.batches.findIndex((b) => b.id === id),
        1,
      );
    });
  }

  private toView(b: Batch): BatchView {
    return {
      ...b,
      courseName: this.db.courseName(b.courseId),
      mentorName: this.db.employeeName(b.mentorId),
      enrolled: this.db.students.filter((s) => s.batchId === b.id && s.status !== 'Dropped').length,
    };
  }
}

function statusOrder(status: BatchStatus): number {
  return status === 'Ongoing' ? 0 : status === 'Upcoming' ? 1 : 2;
}
