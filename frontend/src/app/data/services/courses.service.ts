import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../core/http/api-client';
import { BatchInput, BatchStatus, BatchView, Course, CourseInput } from '../../domain/models';

export interface BatchFilters {
  courseId?: string | null;
  mentorId?: string | null;
  status?: BatchStatus | null;
}

/** Courses & batches: `/courses`, `/batches`. */
@Injectable({ providedIn: 'root' })
export class CoursesService {
  private readonly api = inject(ApiClient);

  getCourses(): Observable<Course[]> {
    return this.api.get<Course[]>('courses', []);
  }

  createCourse(input: CourseInput): Observable<Course> {
    return this.api.post<Course>('courses', input);
  }

  updateCourse(id: string, input: CourseInput): Observable<Course> {
    return this.api.patch<Course>(`courses/${id}`, input);
  }

  deleteCourse(id: string): Observable<void> {
    return this.api.delete(`courses/${id}`);
  }

  getBatches(filters: BatchFilters = {}): Observable<BatchView[]> {
    return this.api.get<BatchView[]>('batches', [], { ...filters });
  }

  createBatch(input: BatchInput): Observable<BatchView> {
    return this.api.post<BatchView>('batches', input);
  }

  updateBatch(id: string, input: BatchInput): Observable<BatchView> {
    return this.api.patch<BatchView>(`batches/${id}`, input);
  }

  deleteBatch(id: string): Observable<void> {
    return this.api.delete(`batches/${id}`);
  }
}
