export interface Course {
  id: string;
  code: string;
  name: string;
  durationMonths: number | null;
  baseFee: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseFilter {
  /** Case-insensitive match on name or code. */
  search?: string;
  isActive?: boolean;
}

export interface CreateCourseInput {
  code: string;
  name: string;
  durationMonths?: number | null;
  baseFee: number;
  isActive?: boolean;
}

export type UpdateCourseInput = Partial<CreateCourseInput>;
