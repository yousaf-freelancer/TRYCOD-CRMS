import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../core/http/api-client';
import {
  DocumentType,
  Student,
  StudentDocument,
  StudentFilters,
  StudentInput,
  StudentListItem,
} from '../../domain/models';

/** Students: `/students`, `/students/:id`, `/students/:id/documents`. */
@Injectable({ providedIn: 'root' })
export class StudentsService {
  private readonly api = inject(ApiClient);

  getStudents(filters: StudentFilters = {}): Observable<StudentListItem[]> {
    return this.api.get<StudentListItem[]>('students', [], { ...filters });
  }

  getStudent(id: string): Observable<StudentListItem | null> {
    return this.api.get<StudentListItem | null>(`students/${id}`, null);
  }

  createStudent(input: StudentInput): Observable<Student> {
    return this.api.post<Student>('students', input);
  }

  updateStudent(id: string, input: StudentInput): Observable<Student> {
    return this.api.patch<Student>(`students/${id}`, input);
  }

  deleteStudent(id: string): Observable<void> {
    return this.api.delete(`students/${id}`);
  }

  getDocuments(studentId: string): Observable<StudentDocument[]> {
    return this.api.get<StudentDocument[]>(`students/${studentId}/documents`, []);
  }

  uploadDocument(
    studentId: string,
    name: string,
    type: DocumentType,
    fileName: string,
    sizeKb: number,
  ): Observable<StudentDocument> {
    return this.api.post<StudentDocument>(`students/${studentId}/documents`, {
      name,
      type,
      fileName,
      sizeKb,
    });
  }
}
